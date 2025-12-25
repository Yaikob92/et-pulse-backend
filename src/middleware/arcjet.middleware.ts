import { aj } from "../config/arcjet";
import { NextFunction, Request, Response } from "express";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const decision = await aj.protect(req, { requested: 5 })
    console.log("Arcjet decision", decision)  //.conclusion

    if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
            return res.status(429).json({ error: "Too Many Requests" });
        } else if (decision.reason.isBot()) {
            return res.status(403).json({ error: "No bots allowed" });
        } else {
            return res.status(403).json({ error: "Forbidden" });
        }
    }

    if (decision.ip.isHosting()) {
        return res.status(403).json({ error: "Forbidden" });
    }

    if (decision.results.some(isSpoofedBot)) {
        return res.status(403).json({ error: "Forbidden" });
    }

    next();
};
