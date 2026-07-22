#!/usr/bin/env node
import process from 'node:process';
import { run } from '../dist/cli.js';

process.exitCode = await run(process.argv.slice(2));
