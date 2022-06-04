import { config } from 'dotenv';

config();

export const configs = {
    token: process.env['TOKEN'],
};
