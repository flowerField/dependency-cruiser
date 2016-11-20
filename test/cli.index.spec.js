"use strict";
const assert    = require("assert");
const main      = require("../src/cli");
const fs        = require("fs");
const tst       = require("./utl/testutensils");
const path      = require("path");
const _         = require("lodash");
const intercept = require("intercept-stdout");

const OUT_DIR = "./test/output";
const FIX_DIR = "./test/fixtures";

/* eslint max-len:0*/
const testPairs = [
    {
        description: "dependency-cruise -f test/output/{{moduleType}}.dir.mk test/fixtures/{{moduleType}}",
        dirOrFile: "test/fixtures/{{moduleType}}",
        options: {
            outputTo: path.join(OUT_DIR, "{{moduleType}}.dir.mk")
        },
        expect: "{{moduleType}}.dir.mk",
        cleanup: true
    },
    {
        description: "dependency-cruise -f test/output/{{moduleType}}.dir.mk test/fixtures/{{moduleType}}",
        dirOrFile: "test/fixtures/{{moduleType}}",
        options: {
            outputTo: path.join(OUT_DIR, "{{moduleType}}.dir.mk")
        },
        expect: "{{moduleType}}.dir.mk",
        cleanup: true
    },
    {
        description: "dependency-cruise -f test/output/{{moduleType}}.file.mk test/fixtures/{{moduleType}}/root_one.js",
        dirOrFile: "test/fixtures/{{moduleType}}/root_one.js",
        options: {
            outputTo: path.join(OUT_DIR, "{{moduleType}}.file.mk")
        },
        expect: "{{moduleType}}.file.mk",
        cleanup: true
    },
    {
        description: "dependency-cruise -f test/output/{{moduleType}}.dir.filtered.mk -x node_modules test/fixtures/{{moduleType}}",
        dirOrFile: "test/fixtures/{{moduleType}}",
        options: {
            outputTo: path.join(OUT_DIR, "{{moduleType}}.dir.filtered.mk"),
            exclude: "node_modules"
        },
        expect: "{{moduleType}}.dir.filtered.mk",
        cleanup: true
    },
    {
        description: "html",
        dirOrFile: "test/fixtures/{{moduleType}}",
        options: {
            outputTo: path.join(OUT_DIR, "{{moduleType}}.dir.filtered.html"),
            outputType: "html",
            exclude: "node_modules"
        },
        expect: "{{moduleType}}.dir.filtered.html",
        cleanup: true
    },
    {
        description: "dot",
        dirOrFile: "test/fixtures/{{moduleType}}",
        options: {
            outputTo: path.join(OUT_DIR, "{{moduleType}}.dir.filtered.dot"),
            outputType: "dot",
            exclude: "node_modules"
        },
        expect: "{{moduleType}}.dir.filtered.dot",
        cleanup: true
    },
    {
        description: "csv",
        dirOrFile: "test/fixtures/{{moduleType}}",
        options: {
            outputTo: path.join(OUT_DIR, "{{moduleType}}.dir.filtered.csv"),
            outputType: "csv",
            exclude: "node_modules"
        },
        expect: "{{moduleType}}.dir.filtered.csv",
        cleanup: true
    }

];

function deleteDammit(pFileName) {
    try {
        fs.unlinkSync(pFileName);
    } catch (e) {
        // process.stderr.write(e.message || e);
    }
}

function resetOutputDir() {
    testPairs
        .filter(pPair => pPair.cleanup)
        .forEach(pPair => {
            try {
                fs.unlinkSync(pPair.options.outputTo.replace("{{moduleType}}", "cjs"));
                fs.unlinkSync(pPair.options.outputTo.replace("{{moduleType}}", "amd"));
            } catch (e) {
                // process.stderr.write(typeof e);
            }
        });

    deleteDammit(path.join(OUT_DIR, "cjs.dir.stdout.json"));
    deleteDammit(path.join(OUT_DIR, "cjs.dir.stdout.mk"));
    deleteDammit(path.join(OUT_DIR, "amd.dir.stdout.mk"));
    deleteDammit(path.join(OUT_DIR, "cjs.dir.dot"));
}

function setModuleType(pTestPairs, pModuleType) {
    return pTestPairs.map(pTestPair => {
        let lRetval = {
            description: pTestPair.description.replace(/{{moduleType}}/g, pModuleType),
            dirOrFile: pTestPair.dirOrFile.replace(/{{moduleType}}/g, pModuleType),
            expect: pTestPair.expect.replace(/{{moduleType}}/g, pModuleType),
            cleanup: pTestPair.cleanup
        };

        lRetval.options = _.clone(pTestPair.options);
        lRetval.options.outputTo = pTestPair.options.outputTo.replace(/{{moduleType}}/g, pModuleType);
        if (Boolean(pTestPair.options.system)) {
            lRetval.options.system = pTestPair.options.system.replace(/{{moduleType}}/g, pModuleType);
        }

        return lRetval;
    });
}

function runFileBasedTests(pModuleType) {
    setModuleType(testPairs, pModuleType).forEach(pPair => {
        it(pPair.description, () => {
            main.main(pPair.dirOrFile, pPair.options);
            tst.assertFileEqual(
                pPair.options.outputTo,
                path.join(FIX_DIR, pPair.expect)
            );
        });
    });
}

describe("#main", () => {
    before("set up", () => {
        resetOutputDir();
    });

    after("tear down", () => {
        resetOutputDir();
    });

    describe("file based tests - commonJS", () => {
        runFileBasedTests("cjs");
    });

    describe("specials", () => {

        it("dependency-cruise test/fixtures/cjs - outputs to stdout", () => {
            let lCapturedStdout = "";
            const unhookIntercept = intercept(pText => {
                lCapturedStdout += pText;
            });

            main.main("test/fixtures/cjs");
            unhookIntercept();
            fs.writeFileSync(
                path.join(OUT_DIR, "cjs.dir.stdout.mk"),
                lCapturedStdout,
                "utf8"
            );

            tst.assertFileEqual(
                path.join(OUT_DIR, "cjs.dir.stdout.mk"),
                path.join(FIX_DIR, "cjs.dir.stdout.mk")
            );
        });

        it("dependency-cruise --output-type json test/fixtures/cjs - outputs a slew of json to stdout", () => {
            let lCapturedStdout = "";
            const unhookIntercept = intercept(pText => {
                lCapturedStdout += pText;
            });

            main.main("test/fixtures/cjs", {outputTo: "-", outputType: 'json'});
            unhookIntercept();
            fs.writeFileSync(
                path.join(OUT_DIR, "cjs.dir.stdout.json"),
                lCapturedStdout,
                "utf8"
            );

            tst.assertFileEqual(
                path.join(OUT_DIR, "cjs.dir.stdout.json"),
                path.join(FIX_DIR, "cjs.dir.stdout.json")
            );
        });

        it("dependency-cruise -f cjs.dir.wontmarch.mk this-doesnot-exist - non-existing generates an error", () => {
            let lCapturedStderr = "";
            const unhookInterceptStdOut = intercept(() => {
                // This space intentionally left empty
            });

            const unhookInterceptStdErr = intercept(pText => {
                lCapturedStderr += pText;
            });

            main.main("this-doesnot-exist", {outputTo: path.join(OUT_DIR, "cjs.dir.wontmarch.mk")});
            unhookInterceptStdOut();
            unhookInterceptStdErr();

            return assert.equal(
                lCapturedStderr,
                "ERROR: Can't open 'this-doesnot-exist' for reading. Does it exist?\n"
            );
        });

        it("dependency-cruise -f /dev/null -M invalidmodulesystem - generates error", () => {
            let lCapturedStderr = "";
            const unhookInterceptStdOut = intercept(() => {
                // This space intentionally left empty
            });

            const unhookInterceptStdErr = intercept(pText => {
                lCapturedStderr += pText;
            });

            main.main(
                "test/fixtures",
                {
                    outputTo: path.join(OUT_DIR, "/dev/null"),
                    system: "invalidmodulesystem"
                }
            );
            unhookInterceptStdOut();
            unhookInterceptStdErr();
            intercept(pText => {
                lCapturedStderr += pText;
            })();

            return assert.equal(
                lCapturedStderr,
                "ERROR: Invalid module system list: 'invalidmodulesystem'\n"
            );
        });

        it("dependency-cruise -f /dev/null -T invalidoutputtype - generates error", () => {
            let lCapturedStderr = "";
            const unhookInterceptStdOut = intercept(() => {
                // This space intentionally left empty
            });

            const unhookInterceptStdErr = intercept(pText => {
                lCapturedStderr += pText;
            });

            main.main(
                "test/fixtures",
                {
                    outputTo: path.join(OUT_DIR, "/dev/null"),
                    outputType: "invalidoutputtype"
                }
            );
            unhookInterceptStdOut();
            unhookInterceptStdErr();
            intercept(pText => {
                lCapturedStderr += pText;
            })();

            return assert.equal(
                lCapturedStderr,
                "ERROR: 'invalidoutputtype' is not a valid output type.\n"
            );
        });

        it("dependency-cruise -f file/you/cant/write/to - generates error", () => {
            let lCapturedStderr = "";
            const unhookInterceptStdOut = intercept(() => {
                // This space intentionally left empty
            });

            const unhookInterceptStdErr = intercept(pText => {
                lCapturedStderr += pText;
            });

            main.main(
                "test/fixtures",
                {
                    outputTo: path.join(OUT_DIR, "file/you/cant/write/to")
                }
            );
            unhookInterceptStdOut();
            unhookInterceptStdErr();
            intercept(pText => {
                lCapturedStderr += pText;
            })();

            return assert.equal(
                lCapturedStderr,
                "ERROR: Writing to 'test/output/file/you/cant/write/to' didn't work. Error: ENOENT: no such file or directory, open 'test/output/file/you/cant/write/to'"
            );
        });

        it("dependency-cruise -f /dev/null -x '([a-zA-z]+)*'  - unsafe exclusion patterns don't run", () => {
            let lCapturedStderr = "";
            const unhookInterceptStdOut = intercept(() => {
                // This space intentionally left empty
            });

            const unhookInterceptStdErr = intercept(pText => {
                lCapturedStderr += pText;
            });

            main.main(
                "test/fixtures",
                {
                    outputTo: path.join(OUT_DIR, "/dev/null"),
                    exclude: "([A-Za-z]+)*"
                }
            );
            unhookInterceptStdOut();
            unhookInterceptStdErr();

            return assert.equal(
                lCapturedStderr,
                "ERROR: The exclude pattern '([A-Za-z]+)*' will probably run very slowly - cowardly refusing to run.\n"
            );
        });
    });
});
