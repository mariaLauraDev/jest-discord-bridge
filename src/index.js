const stripAnsi = require('strip-ansi');
const DiscordWebhook = require('discord-webhook-node');

class DiscordReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
        this._globalConfig = globalConfig;
        this._context = reporterContext;
        this._timeZone = reporterOptions.timeZone || 'America/New_York';
        this._reportIfSuccess = reporterOptions.reportIfSuccess || false;
        
        if (!reporterOptions.webhook) {
            throw new Error('\nPlease set a discord webhook for jest-discord-reporter in jest.config.js');
        }
        
        this._discordOptions = {
            webhook: reporterOptions.webhook,
            userName: reporterOptions.userName || 'Jest Reporter',
            avatar: reporterOptions.avatarUrl || 'https://jestjs.io/pt-BR/img/opengraph.png',
        };
        
        this.webhook = new DiscordWebhook.Webhook(this._discordOptions.webhook);
        this.webhook.setUsername(this._discordOptions.userName);
        this.webhook.setAvatar(this._discordOptions.avatar);
    }


    onRunComplete(test, runResults) {
        let date = new Date();
        let testDateTime = date.toLocaleString('en-US', {timeZone: this._timeZone});

        // collect failure messages
        const failureMessages = runResults.testResults.reduce((acc, { failureMessage }) => {
            if (failureMessage) {
                acc.push(stripAnsi(failureMessage));
            }

            return acc;
        }, []);

        // send messages by Discord webhook according to the test results and test date and time
        if (failureMessages.length) {
            this.webhook.send(`**SITE ALERT**: Test date and time: ${testDateTime}\n ${failureMessages.join('\n')}`);
        } else if (this._reportIfSuccess) {
            this.webhook.send(`**SITE STATUS**: Test date and time: ${testDateTime}\n All tests passed!`);
        }
    }
}

module.exports = DiscordReporter;
