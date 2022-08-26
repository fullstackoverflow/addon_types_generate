#!/usr/bin/env ts-node-script
import { App, cli, flag } from '@deepkit/app';
import { readFileSync, writeFileSync } from 'fs';
import { Compiler } from './compiler';

@cli.controller('compile', {
    description: 'compile files'
})
class CompilerCommand {
    async execute(
        @flag.char('i') input_files: string[],
        @flag.char('o') output_file?: string
    ) {
        const compiler_instance = new Compiler();
        const codes = input_files.map(file => {
            return compiler_instance.compile(readFileSync(file, { encoding: "utf8" }));
        });
        if (output_file) {
            writeFileSync(output_file, codes.join("\n\n"));
        } else {
            console.log(codes.join("\n\n"));
        }
    }
}

new App({
    controllers: [CompilerCommand]
}).run();