/*
 * grunt-scorm-manifest
 * https://github.com/stalsma/grunt-scorm-manifest
 *
 * Copyright (c) 2014 Scott Talsma
 *
 * Derived from work by Ray Gesualdo
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    //Helper function for Windows systems
    var unixifyPath = function (filepath) {
        if (process.platform === 'win32') {
            return filepath.replace(/\\/g, '/');
        } else {
            return filepath;
        }
    };

    grunt.registerMultiTask('scorm_manifest', 'Generate a valid SCORM IMS manifest file.', function () {

            //Default options
            var options = this.options({
                schemaDir: '',
                version: '2004',
                courseId: 'CourseID',
                SCOtitle: 'SCO Title',
                moduleTitle: 'Module',
                launchPage: 'index.html',
                path: './'
            });

            //Instantiate XML tokens
            var xmlTokens = {
                versionString: '2004 3rd Edition',
                scormType: 'adlcp:scormType',
                fileArr: [
                    {'@identifier': 'resource_1'},
                    {'@type': 'webcontent'},
                    {'@href': options.launchPage}
                ]
            };

            //Check version and set appropriate tokens
            switch (options.version.toLowerCase()) {
                case "1.2":
                    xmlTokens.versionString = '1.2';
                    xmlTokens.scormType = 'adlcp:scormtype';
                    break;
                case "2004": //fallthrough
                case "2004v3":
                    xmlTokens.versionString = '2004 3rd Edition';
                    xmlTokens.scormType = 'adlcp:scormType';
                    break;
            }

            //Hack to handle dynamic attribute name using token
            (function () {
                var tObj = {};
                tObj['@' + xmlTokens.scormType] = 'sco';
                xmlTokens.fileArr.push(tObj);
            })();


            //Declare XMl structure
            var xmlObj = {
                manifest: {
                    '@identifier': options.courseId,
                    '@version': '1',
                    metadata: {
                        schema: 'ADL SCORM',
                        schemaversion: xmlTokens.versionString
                    },
                    organizations: {
                        '@default': options.courseId + '-org',
                        organization: {
                            '@identifier': options.courseId + '-org',
                            title: options.SCOtitle,
                            item: []
                        }
                        // {
                        //     //we have to drop each item into a list; otherwise the array will get collapsed to a single item
                        //     //https://github.com/oozcitak/xmlbuilder-js/wiki/Conversion-From-Object
                        //     'item': []
                        // }
                    },
                    resources: {
                        //we have to drop each item into a list; otherwise the array will get collapsed to a single item
                        //https://github.com/oozcitak/xmlbuilder-js/wiki/Conversion-From-Object
                        'resource': []
                    }
                }
            };

            var parseFileBlockFn = function (fileBlock) {
                //use this array to accumulate all the files for the sco from the various <file> entries
                var fileArr = [];


                //Make sure multiple files have been specified in Gruntfile
                if (fileBlock.expand) {
                    grunt.log.ok('Multiple files specified.');
                }

                // Iterate over all specified file groups.
                fileBlock.src.forEach(function (curFile) {
                    //expand the files if necessary
                    var scoFiles;

                    if (fileBlock.expand) {
                        scoFiles = grunt.file.expand({cwd: fileBlock.cwd}, curFile);
                    } else {
                        scoFiles = curFile.src;
                    }


                    scoFiles.filter(function (filepath) {
                        var expandedFile = fileBlock.cwd + '/' + filepath;

                        if (!grunt.file.exists(expandedFile)) {
                            grunt.log.warn('Source file "' + expandedFile + '" not found.');
                            return false;
                        } else if (filepath.indexOf('imsmanifest.xml') > -1) {
                            grunt.log.warn('imsmanifest.xml included in file list.');
                            return false;
                        } else {
                            fileArr.push(
                                {
                                    file: {
                                        '@href': options.courseSubDir + filepath
                                    }
                                }
                            );
                            return true;

                        }
                    }); //end scoFiles.filter

                }); //end fileBlock.src.forEach

                return fileArr;
            };

            if (options.common) {
                var fileArr = [];
                options.common.files.forEach(function (fileBlock) {
                    fileArr = fileArr.concat(parseFileBlockFn(fileBlock));
                });

                //need to push the follow attributes
                //<resource identifier="ALLRESOURCES" type="webcontent" adlcp:scormtype="asset">
                var commonResource = {
                    'resource': {
                        '@identifier': options.common.id,
                        '@type': 'webcontent',
                        '@adlcp:scormtype': 'asset',
                        'file': []
                    },
                };

                fileArr.forEach(function (file) {
                    commonResource.resource.file.push({'@href': file.file['@href']});
                });

                xmlObj.manifest.resources.resource.push(commonResource.resource);
            }

            options.scos.forEach(function (sco) {
                grunt.log.ok('Building sco w/id ' + sco.id);
                var newSco = {
                    'item': {
                        '@identifier': sco.id,
                        '@identifierref': sco.id + '_resource',
                        '@isvisible': 'true',
                        title: sco.moduleTitle
                    }
                };
                if (sco.prereqId) {
                    newSco.item['adlcp:prerequisites'] = {
                        '#text': sco.prereqId,
                        '@type': 'aicc_script'
                    };
                }
                if (sco.masteryScore) {
                    newSco.item['adlcp:masteryscore'] = sco.masteryScore;
                }

                xmlObj.manifest.organizations.organization.item.push(newSco.item);

                //now deal with the resources for the currnet sco; each has an array of file blocks allocated
                sco.files.forEach(function (fileBlock) {
                    var fileArr = parseFileBlockFn(fileBlock);

                    //need to push the follow attributes
                    //identifier="SCO1" type="webcontent" adlcp:scormtype="sco" href="html/PreAssessment/index.html">
                    var curResource = {
                        'resource': {
                            '@identifier': newSco.item['@identifierref'],
                            '@type': 'webcontent',
                            '@adlcp:scormtype': 'sco',
                            '@href': options.courseSubDir + sco.launchPage,
                            'file': []
                        }
                    };

                    fileArr.forEach(function (file) {
                        curResource.resource.file.push({'@href': file.file['@href']});
                    });

                    //if the SCO uses the common resources section
                    if (sco.includeCommonResources) {
                        //need to add something like this: <dependency identifierref="ALLRESOURCES"/>
                        var dependsNode = {
                            '@identifierref': options.common.id
                        };
                        curResource.resource.dependency = dependsNode;
                    }

                    xmlObj.manifest.resources.resource.push(curResource.resource);

                }); //end sco.files.forEach
            });


            //Instatiate xmlbuilder using xmlObj
            var xmlDoc = require('xmlbuilder').create(xmlObj,
                {version: '1.0', encoding: 'UTF-8', standalone: true},
                {ext: null},
                {allowSurrogateChars: false, headless: false, stringify: {}});

            //Check version and set appropriate manifest attributes
            switch (options.version.toLowerCase()) {
                case "1.2":
                    //note that we cannot move the schemas out of the course root in SCORM 1.2;
                    // the resulting SCORM package will not validate in the test suite
                    xmlDoc.att('xmlns', 'http://www.imsproject.org/xsd/imscp_rootv1p1p2')
                        .att('xmlns:adlcp', 'http://www.adlnet.org/xsd/adlcp_rootv1p2')
                        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
                        .att('xsi:schemaLocation', 'http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd');
                    break;
                case "2004": //fallthrough
                case "2004v3":
                    xmlDoc.att('xmlns', 'http://www.imsglobal.org/xsd/imscp_v1p1')
                        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
                        .att('xmlns:adlcp', 'http://www.adlnet.org/xsd/adlcp_v1p3')
                        .att('xmlns:adlseq', 'http://www.adlnet.org/xsd/adlseq_v1p3')
                        .att('xmlns:adlnav', 'http://www.adlnet.org/xsd/adlnav_v1p3')
                        .att('xmlns:imsss', 'http://www.imsglobal.org/xsd/imsss')
                        .att('xsi:schemaLocation', 'http://www.imsglobal.org/xsd/imscp_v1p1 ' + options.schemaDir + 'imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 ' + options.schemaDir + 'adlcp_v1p3.xsd http://www.adlnet.org/xsd/adlseq_v1p3 ' + options.schemaDir + 'adlseq_v1p3.xsd http://www.adlnet.org/xsd/adlnav_v1p3 ' + options.schemaDir + 'adlnav_v1p3.xsd http://www.imsglobal.org/xsd/imsss ' + options.schemaDir + 'imsss_v1p0.xsd');
                    break;
            }

            //Make it pretty
            var prettyXmlDoc = xmlDoc.end({pretty: true});

            //Write file to safe path
            options.path = unixifyPath(options.path);

            //load path module
            var path = require('path');

            var manifestPath = path.join(options.path, 'imsmanifest.xml');
            grunt.file.delete(manifestPath);
            grunt.file.write(manifestPath, prettyXmlDoc);

            //Leave a sucess message
            grunt.log.writeln('File "' + manifestPath + '" created.');

        }
    )
    ;

};