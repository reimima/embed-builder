import { Bot } from './Bot';
import { configs } from './config';

const instance = new Bot();

instance.login(configs.token).catch(e => console.error(e));
