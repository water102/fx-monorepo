#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { renderTemplate } from './utils';
import { editFileContent } from './utils';
// import * as shell from 'shelljs';

const CURR_DIR = process.cwd();

const templatesPath = path.join(__dirname, '../../../', 'starter-kit-templates');

const CHOICES = fs.readdirSync(templatesPath);

const QUESTIONS = [
  {
    name: 'template',
    type: 'list',
    message: 'What template would you like to use?',
    choices: CHOICES
  },
  {
    name: 'name',
    type: 'input',
    message: 'Please input a new project name:'
  },
  {
    name: 'targetDirectory',
    type: 'directory',
    message: 'Where you like to put this project?',
    basePath: CURR_DIR
  }
];

const SKIP_FILES = ['node_modules', 'package-lock.json', '.template.json', ''];

export interface CliOptions {
  projectName: string
  templateName: string
  templatePath: string
  targetPath: string
}

(() => {
  let isUpdate: boolean = false;

  let options: CliOptions;

  inquirer.registerPrompt('directory', require('inquirer-select-directory'));
  inquirer.prompt(QUESTIONS).then(answers => {
    const projectChoice = answers['template'];
    const projectName = answers['name'];
    const targetDirectory = answers['targetDirectory'];

    //@ts-ignore
    const templatePath = path.join(templatesPath, projectChoice);
    //@ts-ignore
    const targetPath = path.join(targetDirectory, projectName);

    options = {
      //@ts-ignore
      projectName,
      //@ts-ignore
      templateName: projectChoice,
      templatePath,
      targetPath
    }

    createProject(targetPath);

    //@ts-ignore
    createDirectoryContents(templatePath, targetPath, '');

    postProcess(options);
  });

  function createProject(projectPath: string) {
    if (fs.existsSync(projectPath)) {
      console.log(chalk.yellowBright('Updating the project..'));
      isUpdate = true;
    } else if (!fs.existsSync(projectPath)) {
      console.log(chalk.yellowBright('Creating the project..'));
      fs.mkdirSync(projectPath);
    }
  }


  function createDirectoryContents(templatePath: string, targetPath: string, currentPath: string) {
    // read all files/folders (1 level) from template folder
    const filesToCreate = fs.readdirSync(templatePath);
    // loop each file/folder
    filesToCreate.forEach(file => {
      const origFilePath = path.join(templatePath, file);

      // get stats about the current file
      const stats = fs.statSync(origFilePath);

      // skip files that should not be copied
      if (SKIP_FILES.indexOf(file) > -1) return;

      if (stats.isFile()) {
        // read file content and transform it using template engine
        let contents = fs.readFileSync(origFilePath, 'utf8');
        contents = renderTemplate(contents, { projectName: options.projectName });
        // write file to destination folder
        const writePath = path.join(targetPath, currentPath, file);
        fs.writeFileSync(writePath, contents, 'utf8');
      } else if (stats.isDirectory()) {
        if (!fs.existsSync(path.join(targetPath, currentPath, file))) {
          // create folder in destination folder
          fs.mkdirSync(path.join(targetPath, currentPath, file));
        }
        // copy files/folder inside current folder recursively
        createDirectoryContents(path.join(templatePath, file), targetPath, path.join(currentPath, file));
      }
    });
  }

  async function postProcess(options: CliOptions) {
    const packageJsonPath = path.join(options.targetPath, 'package.json')
    const isNode = fs.existsSync(packageJsonPath);

    if (isNode) {
      await editFileContent(
        packageJsonPath,
        async (currentContent: string) => {
          const packageJsonData = JSON.parse(currentContent);
          packageJsonData.name = options.projectName
          return JSON.stringify(packageJsonData, null, 2)
        }
      )

      //   shell.cd(options.targetPath);
      //   const result = shell.exec('npm install');
      //   if (result.code !== 0) {
      //     console.log(chalk.redBright('Failed'));
      //     return false;
      //   }
    }

    if (isUpdate) {
      console.log(chalk.greenBright('Project successfully updated'));
    } else {
      console.log(chalk.greenBright('Project successfully created'));
    }

    return true;
  }
})()