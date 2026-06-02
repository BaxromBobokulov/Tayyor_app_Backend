import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate{
    constructor(private jwtService : JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const host  = context.switchToHttp()
        const req = host.getRequest()
        let token = req.headers.authorization

        if(!token) throw new UnauthorizedException("Tokensiz so'rov yubora olmaysiz")

        try {
            token = token.split(" ")[1]
            token = this.jwtService.verify(token)
            req["user"] = token

        } catch (error:any) {
            if(error?.name === 'TokenExpiredError') throw new UnauthorizedException("JWT expired")

            throw new UnauthorizedException("Something wrong in JWT")
        }


        return true
        
    }
}