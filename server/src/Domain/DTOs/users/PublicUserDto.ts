export class PublicUserDto {
  constructor(
    public id: number = 0,
    public gamer_tag: string = "",
    public full_name: string = "",
    public profile_image: string | null = null,
  ) {}
}
