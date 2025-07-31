import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../utils/refine_zod';


const userhistroyCore = z.object({
    pageno: z.number(),
    perPage: z.number(),
    username: z.string().optional(),
    userEmail: z.string().optional(),
    fromDate: z.date(),
    toDate: z.date(),
    ApiMethod: z.string(),
    ip_Address: z.string().optional(),

});
export type userHistroyReportSchema = z.infer<typeof userhistroyCore>;
export const { schemas: userHistroySchema, $ref } = buildJsonSchemas(
    {
        userhistroyCore,
    },

);
