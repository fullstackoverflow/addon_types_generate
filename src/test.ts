#!/usr/bin/env ts-node-script
import { App, cli, flag, arg } from '@deepkit/app';

@cli.controller('test')
class TestCommand {
    async execute(@arg title: string, @flag id: number) {
        console.log('id:', id)
    }
}

new App({
    controllers: [TestCommand]
}).run();