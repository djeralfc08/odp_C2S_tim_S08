#!/bin/sh
# Run INSIDE the master container:
#   docker cp docker/setup-replication.sh project_master:/setup.sh
#   docker exec project_master sh /setup.sh
#
# STRATEGY:
#   1. Create schema on Master
#   2. Lock Master, read binlog position, dump schema
#   3. Import schema dump DIRECTLY into each Slave (bypassing replication)
#   4. Configure Slaves to start replication FROM current position
#   => Slaves have the schema already, replication only handles new data

ROOT_PASS="root1234"
REPL_USER="replicator"
REPL_PASS="repl1234"

# TODO: Replace "project_db" with your actual database name
DB_NAME="project_db"

M="mysql  -h127.0.0.1    -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"
S1="mysql -hmysql-slave1 -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"
S2="mysql -hmysql-slave2 -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"

SCHEMA_FILE="/tmp/project_schema.sql"

echo ""
echo "========================================================"
echo "  Project -- MySQL Replication Setup"
echo "========================================================"

# ── 1. Wait for all nodes ─────────────────────────────────────
wait_mysql() {
  HOST=$1; NAME=$2
  printf "  Waiting for %s" "$NAME"
  i=0
  while [ $i -lt 30 ]; do
    mysql -h"$HOST" -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
      --connect-timeout=3 -e "SELECT 1" > /dev/null 2>&1 \
      && echo " OK" && return 0
    printf "."; sleep 3; i=$((i+1))
  done
  echo " TIMEOUT"; exit 1
}

echo ""
echo "[ 1/5 ] Checking node availability..."
wait_mysql "127.0.0.1"    "Master"
wait_mysql "mysql-slave1" "Slave1"
wait_mysql "mysql-slave2" "Slave2"
sleep 2

# ── 2. Create schema on Master ────────────────────────────────
echo ""
echo "[ 2/5 ] Creating schema on Master..."

$M -e "DROP DATABASE IF EXISTS ${DB_NAME};"
$M -e "CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# PulseGrid — minimal schema for checkpoint 1 (tables + FKs + four M:N junction tables)
$M ${DB_NAME} << 'SQL'
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  gamer_tag     VARCHAR(30)  NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_image LONGTEXT NULL,
  role          ENUM('player','admin') NOT NULL DEFAULT 'player',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_gamer_tag (gamer_tag),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE games (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                   VARCHAR(200) NOT NULL,
  logo_url               VARCHAR(512) NULL,
  genre                  VARCHAR(100) NOT NULL DEFAULT '',
  max_players_per_team   INT UNSIGNED NOT NULL DEFAULT 5,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL,
  tag         VARCHAR(6)   NOT NULL,
  logo_url    VARCHAR(512) NULL,
  description TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teams_tag (tag)
);

CREATE TABLE tournaments (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id                 INT UNSIGNED NOT NULL,
  name                    VARCHAR(120) NOT NULL,
  format                  ENUM('single_elimination','double_elimination','round_robin') NOT NULL,
  max_teams               INT UNSIGNED NOT NULL,
  registration_deadline   DATETIME NOT NULL,
  starts_at               DATETIME NOT NULL,
  ends_at                 DATETIME NULL,
  prize_pool              VARCHAR(255) NULL,
  status                  ENUM('draft','registration_open','registration_locked','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tournaments_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT,
  KEY idx_tournaments_game (game_id),
  KEY idx_tournaments_status (status)
);

CREATE TABLE matches (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tournament_id    INT UNSIGNED NOT NULL,
  round_number     INT UNSIGNED NOT NULL DEFAULT 1,
  bracket_position INT UNSIGNED NOT NULL DEFAULT 0,
  team1_id         INT UNSIGNED NULL,
  team2_id         INT UNSIGNED NULL,
  winner_team_id   INT UNSIGNED NULL,
  score            VARCHAR(32) NULL,
  match_status     ENUM('scheduled','ongoing','completed') NOT NULL DEFAULT 'scheduled',
  scheduled_at     DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_team1 FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_matches_team2 FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_matches_winner FOREIGN KEY (winner_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  KEY idx_matches_tournament (tournament_id)
);

CREATE TABLE team_members (
  team_id   INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  role      ENUM('captain','member') NOT NULL DEFAULT 'member',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_tm_user (user_id)
);

CREATE TABLE team_invitations (
  team_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  status     ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  CONSTRAINT fk_ti_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_ti_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_ti_user (user_id)
);

CREATE TABLE tournament_registrations (
  tournament_id  INT UNSIGNED NOT NULL,
  team_id        INT UNSIGNED NOT NULL,
  registered_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('pending','confirmed','disqualified') NOT NULL DEFAULT 'pending',
  seed           INT UNSIGNED NULL,
  PRIMARY KEY (tournament_id, team_id),
  CONSTRAINT fk_tr_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_tr_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  KEY idx_tr_team (team_id)
);

CREATE TABLE match_players (
  match_id           INT UNSIGNED NOT NULL,
  user_id            INT UNSIGNED NOT NULL,
  team_id            INT UNSIGNED NOT NULL,
  performance_notes  TEXT NULL,
  PRIMARY KEY (match_id, user_id),
  CONSTRAINT fk_mp_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT fk_mp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_mp_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  KEY idx_mp_user (user_id)
);

CREATE TABLE user_watchlist (
  user_id        INT UNSIGNED NOT NULL,
  tournament_id  INT UNSIGNED NOT NULL,
  added_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tournament_id),
  CONSTRAINT fk_uw_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uw_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  action     VARCHAR(64)  NOT NULL,
  entity     VARCHAR(64)  NULL,
  entity_id  INT UNSIGNED NULL,
  details    TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_audit_created (created_at),
  KEY idx_audit_user (user_id)
);
SQL

MASTER_TABLES=$($M -s --skip-column-names \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null)
echo "  Master tables: ${MASTER_TABLES}"
if [ "${MASTER_TABLES:-0}" -lt "2" ]; then
  echo "  ERROR: Schema creation failed on Master"
  exit 1
fi
AUDIT_OK=$($M -s --skip-column-names \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}' AND table_name='audit_logs';" 2>/dev/null)
if [ "${AUDIT_OK:-0}" != "1" ]; then
  echo "  ERROR: audit_logs table missing after schema step"
  exit 1
fi
echo "  audit_logs: OK"

# ── 3. Lock Master, get binlog position, dump schema ─────────
echo ""
echo "[ 3/5 ] Locking Master, reading binlog position, dumping schema..."

$M -e "FLUSH TABLES WITH READ LOCK;" > /dev/null 2>&1

STATUS=$($M --skip-column-names -e "SHOW MASTER STATUS;" 2>/dev/null)
BINLOG_FILE=$(echo "$STATUS" | awk '{print $1}')
BINLOG_POS=$(echo  "$STATUS" | awk '{print $2}')

if [ -z "$BINLOG_FILE" ] || [ -z "$BINLOG_POS" ]; then
  echo "  ERROR: Could not read SHOW MASTER STATUS"
  exit 1
fi
echo "  File     : $BINLOG_FILE"
echo "  Position : $BINLOG_POS"

mysqldump -h127.0.0.1 -P3306 -uroot -p"${ROOT_PASS}" --protocol=TCP \
  --no-data --skip-lock-tables --no-tablespaces \
  ${DB_NAME} > "$SCHEMA_FILE" 2>/dev/null

$M -e "UNLOCK TABLES;" > /dev/null 2>&1

DUMP_LINES=$(wc -l < "$SCHEMA_FILE")
echo "  Schema dump: ${DUMP_LINES} lines"

# ── 4. Import schema into Slaves, then configure replication ──
echo ""
echo "[ 4/5 ] Importing schema into Slave1..."
$S1 -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$S1 ${DB_NAME} < "$SCHEMA_FILE"

S1_TABLES=$(mysql -hmysql-slave1 -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
  -s --skip-column-names --connect-timeout=5 \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null)
echo "  Slave1 tables after import: ${S1_TABLES:-0}"

printf "STOP REPLICA;\nRESET REPLICA ALL;\nCHANGE REPLICATION SOURCE TO SOURCE_HOST='mysql-master', SOURCE_PORT=3306, SOURCE_USER='%s', SOURCE_PASSWORD='%s', SOURCE_LOG_FILE='%s', SOURCE_LOG_POS=%s, GET_SOURCE_PUBLIC_KEY=1;\nSTART REPLICA;\n" \
  "$REPL_USER" "$REPL_PASS" "$BINLOG_FILE" "$BINLOG_POS" | $S1
echo "  Slave1 replication started"

echo "  Importing schema into Slave2..."
$S2 -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$S2 ${DB_NAME} < "$SCHEMA_FILE"

S2_TABLES=$(mysql -hmysql-slave2 -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
  -s --skip-column-names --connect-timeout=5 \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null)
echo "  Slave2 tables after import: ${S2_TABLES:-0}"

printf "STOP REPLICA;\nRESET REPLICA ALL;\nCHANGE REPLICATION SOURCE TO SOURCE_HOST='mysql-master', SOURCE_PORT=3306, SOURCE_USER='%s', SOURCE_PASSWORD='%s', SOURCE_LOG_FILE='%s', SOURCE_LOG_POS=%s, GET_SOURCE_PUBLIC_KEY=1;\nSTART REPLICA;\n" \
  "$REPL_USER" "$REPL_PASS" "$BINLOG_FILE" "$BINLOG_POS" | $S2
echo "  Slave2 replication started"

sleep 3

# ── 5. Verify ─────────────────────────────────────────────────
echo ""
echo "[ 5/5 ] Verifying replication..."
echo ""

check_slave() {
  HOST=$1; NAME=$2
  STATUS=$(mysql -h"$HOST" -P3306 -uroot -p"$ROOT_PASS" \
    --protocol=TCP --connect-timeout=5 \
    -e "SHOW REPLICA STATUS\G" 2>/dev/null)

  IO=$(echo  "$STATUS" | grep "Replica_IO_Running:"  | awk '{print $2}')
  SQL=$(echo "$STATUS" | grep "Replica_SQL_Running:" | awk '{print $2}')
  ERR=$(echo "$STATUS" | grep "Last_Error:" | sed 's/.*Last_Error: //')
  BEHIND=$(echo "$STATUS" | grep "Seconds_Behind_Source:" | awk '{print $2}')

  TABLES=$(mysql -h"$HOST" -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
    --connect-timeout=5 -s --skip-column-names \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" \
    2>/dev/null)

  echo "  $NAME:"
  echo "    IO_Running     : ${IO:-N/A}"
  echo "    SQL_Running    : ${SQL:-N/A}"
  echo "    Seconds_Behind : ${BEHIND:-N/A}"
  echo "    Tables         : ${TABLES:-0}"

  if [ "$IO" = "Yes" ] && [ "$SQL" = "Yes" ]; then
    echo "    >>> REPLICATION ACTIVE <<<" 
  else
    echo "    >>> CHECK FAILED <<<"
    [ -n "$ERR" ] && [ "$ERR" != "" ] && echo "    Last_Error: $ERR"
  fi
  echo ""
}

check_slave "mysql-slave1" "Slave1"
check_slave "mysql-slave2" "Slave2"

rm -f "$SCHEMA_FILE"

echo "========================================================"
echo "  Done! Start the server: cd server && npm run dev"
echo "========================================================"
