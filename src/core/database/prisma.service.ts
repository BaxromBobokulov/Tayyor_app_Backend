import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {Pool} from "pg";



@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy , OnModuleInit {
    constructor() {
        const connectionString = process.env.DATABASE_URL
        if(!connectionString) throw Error("Url not found")
        const pool  = new Pool({connectionString})
        const adapter = new PrismaPg(pool)
        super({adapter, log:["error", "warn"]})
    }

    async onModuleDestroy() {
        await this.$disconnect()
        Logger.log("❌ database disconnected")
    }

    async onModuleInit() {
        await this.$connect()
        Logger.log("✅ database connected")
    }
}