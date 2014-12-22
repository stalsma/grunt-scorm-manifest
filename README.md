# grunt-scorm-manifest

> A grung plugin that generates a valid SCORM IMS manifest file.

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-scorm-manifest --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-scorm-manifest');
```

## The "scorm_manifest" task

_Run this task with the `grunt scorm_manifest` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Node Libraries Used:
[xmlbuilder-js](https://github.com/oozcitak/xmlbuilder-js) (for xml generation).

### Config

In your project's Gruntfile, add a section named `scorm_manifest` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  scorm_manifest: {
    your_target: {
		options: {
		  // Options go here
		}
	},
  },
});
```

### Options

#### options.version
Type: `String`
Default value: `'2004'`
Possible values: `2004||1.2`

This is used to define which version of SCORM will be applied to the manifest.

#### options.courseId
Type: `String`
Default value: `'CourseID'`

This is used to define the top-level course ID.

#### options.SCOtitle
Type: `String`
Default value: `'SCO Title'`

This is used (by `<organization />`) to define the title of the default organization.  There will be only one organization.

#### options.path
Type: `String`
Default value: `'./'`

This is used to define the path to which `imsmanifest.xml` will be written.

#### options.courseSubDir
Type: `String`
Default value: `'./'`

Path to course files relative to imsmanifest file.

#### options.common
Type: `Object`
Default value: `{}`

Defines whether or not the course has a common section of resources shared by multiple scos.

#### options.common.id
Type: `String`
Default value: ``

The id of the common resource section.

#### options.common.files
Type: `Array`
Default value: `[]`

A block of files that be inserted into the common resources section.

Example:
```js
//sample configuration of common resources.  It will include all files in the misc, scripts, styles, PDFs, and images
// folders, but will omit images in module-specific folders (e.g. images/Module1)
common:
    {
        id: 'commonResources',
        files: [{
            expand: true,       // required
            cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
            src: ['blank.html','misc/*.*','scripts/**.*','styles/**.*','PDFs/**.*','images/!(intro|splash|Module1|Module2|Module3|Module4)/**.*'],    // file selector (this example includes subdirectories)
            filter: 'isFile'    // required
        }]
    }
```

#### options.scos
Type: `Array`
Default value: `[]`

An array of all the scos that will be defined.  Each sco entry has the following properties:

#### options.scos[n].id
Type: `String`

This is the id of the sco.  It will be also used to create the sco's corresponding resource section.  No spaces allowed.

#### options.scos[n].moduleTitle
Type: `String`

This is the title of the sco.

#### options.scos[n].launchPage
Type: `String`

This is the launch page for the sco (e.g. module1/index.html).

#### options.scos[n].includeCommonResources
Type: `Boolean`
Default value: `false`

Whether or not the SCO makes use of common resources (e.g. style sheets, scripts, etc.).

#### options.scos[n].prereqId
Type: `String`
Default value: ``

Id of another sco that should be assigned as a prerequisite for the current SCO.  Optional.

#### options.scos[n].masteryScore
Type: `Number`
Default value: ``

Mastery score for the SCO. Optional.


#### options.scos[n].files
Type: `Array`
Default value: `[]`

Array of file blocks to be included w/in the SCO's resource section.

Sample SCO
```js
{
    id: 'sco_intro',
    moduleTitle: 'Introduction',
    launchPage: 'intro/splash.html',
    includeCommonResources: true,
    files: [{
        expand: true,       // required
        cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
        src: ['intro/*.*','images/intro/*.*','images/splash/*.*'],    // file selector (this example includes subdirectories)
        filter: 'isFile'    // required
    }]
}
```

### Usage Example

This example creates a SCORM 1.2 IMS manifest. The manifest will be written to the project directory and will include files in the project directory and all subdirectories.

```js
// simple single SCO package
 scorm_manifest: {
            dist: {
                options: {
                    version: '1.2',
                    courseId: 'partCD2015',
                    SCOtitle: '2015 Medicare Part C and Part D Reporting Requirements and Validation',
                    path: '<%= config.distScorm %>',
                    courseSubDir: '<%= config.courseSubDir %>',
                    scos: [
                        {
                            id: 'sco_intro',
                            moduleTitle: 'Introduction',
                            launchPage: 'intro/splash.html',
                            includeCommonResources: true,
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['intro/*.*','images/intro/*.*','images/splash/*.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        },
                        {
                            id: 'sco_preAssessment',
                            moduleTitle: 'Pre-Assessment',
                            launchPage: 'PreAssessment/index.html',
                            prereqId: 'sco_intro',
                            includeCommonResources: true,
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['PreAssessment/*.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        },
                        {
                            id: 'sco_lesson1',
                            moduleTitle: 'Module 1: Planning for Data Validation (DV) Activities',
                            launchPage: 'Module1/index.html',
                            prereqId: 'sco_preAssessment',
                            includeCommonResources: true,
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['Module1/*.*','images/Module1/*.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        },
                        {
                            id: 'sco_lesson2',
                            moduleTitle: 'Module 2: Performing Data Validation (DV) Activities',
                            launchPage: 'Module2/index.html',
                            prereqId: 'sco_lesson1',
                            includeCommonResources: true,
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['Module2/*.*','images/Module2/*.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        },
                        {
                            id: 'sco_lesson3',
                            moduleTitle: 'Module 3: Analyzing Results and Submission of Findings',
                            launchPage: 'Module3/index.html',
                            prereqId: 'sco_lesson2',
                            includeCommonResources: true,
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['Module3/*.*','images/Module3/*.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        },
                        {
                            id: 'sco_lesson4',
                            moduleTitle: 'Module 4: Completing Post-Data Validation (DV) Activities',
                            launchPage: 'Module4/index.html',
                            prereqId: 'sco_lesson3',
                            includeCommonResources: true,
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['Module4/*.*','images/Module4/*.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        },
                        {
                            id: 'sco_postAssessment',
                            moduleTitle: 'Post-Assessment',
                            launchPage: 'PostAssessment/index.html',
                            prereqId: 'sco_lesson4',
                            masteryScore: '70',
                            includeCommonResources: true,
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['PostAssessment/*.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        }
                    ],
                    common:
                        {
                            id: 'commonResources',
                            files: [{
                                expand: true,       // required
                                cwd: '<%= config.dist %>',          // start looking for files to list in the same dir as Gruntfile
                                src: ['blank.html','misc/*.*','scripts/**.*','styles/**.*','PDFs/**.*','images/!(intro|splash|Module1|Module2|Module3|Module4)/**.*'],    // file selector (this example includes subdirectories)
                                filter: 'isFile'    // required
                            }]
                        }
                }
            }
        },
```

## Release History
  * 2013-12-18   v0.2.0   Initial plugin release.