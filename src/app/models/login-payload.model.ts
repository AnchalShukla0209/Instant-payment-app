export interface LoginPayload {
  username: string;
  password: string;
}
export interface JwtPayload {
  userid: string;
  username: string;
  usertype: string;
}
export interface OTPPayload {
  usertype: string;
  userid: string;
}
