const ui = require('@tryghost/pretty-cli').ui;
const curatedMembers = require('../sources/curated-members');

// Internal ID in case we need one.
exports.id = 'curated-members';

exports.group = 'Sources:';

// The command to run and any params
exports.flags = 'curated-members <pathToFile>';

// Description for the top level command
exports.desc = 'Migrate from Curated subscribers CSV';

// Descriptions for the individual params
exports.paramsDesc = ['Path to the signups CSV file as generated by Curated'];

// Configure all the options
exports.setup = (sywac) => {
    sywac.boolean('-V --verbose', {
        defaultValue: false,
        desc: 'Show verbose output'
    });
    sywac.boolean('--zip', {
        defaultValue: true,
        desc: 'Create a zip file (set to false to skip)'
    });
    sywac.number('-l, --limit', {
        defaultValue: 5000,
        desc: 'Define the batch limit for import files.'
    });
    sywac.string('--freeLabel', {
        defaultValue: 'curated-free',
        desc: 'Provide a label for Curated free subscribers'
    });
};

// What to do when this command is executed
exports.run = async (argv) => {
    let timer = Date.now();
    let context = {errors: []};

    if (argv.verbose) {
        ui.log.info(`Migrating from export at ${argv.pathToFile}${argv.subs ? ` and ${argv.subs}` : ``}`);
    }

    try {
        // Fetch the tasks, configured correctly according to the options passed in
        let migrate = curatedMembers.getTaskRunner(argv.pathToFile, argv);

        // Run the migration
        await migrate.run(context);

        if (argv.verbose) {
            ui.log.info('Done', require('util').inspect(context.result.data, false, 2));
        }
    } catch (error) {
        ui.log.info('Done with errors', context.errors);
    }

    if (argv.verbose) {
        ui.log.info(`Cached files can be found at ${context.fileCache.cacheDir}`);

        if (context.logs) {
            ui.log.info(`Adjusted members due to passed in options:`);

            context.logs.forEach((log) => {
                ui.log.info(log.info);
            });
        }
    }

    if (context.result.skip) {
        context.result.skip.forEach((skipped) => {
            ui.log.warn(`Skipped import: ${skipped.info}`);
        });
    }

    // Report success
    ui.log.ok(`Successfully written output to ${context.outputFile} in ${Date.now() - timer}ms.`);
};
