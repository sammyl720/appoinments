import { join } from 'path';
import { renderFile } from 'ejs';
import { existsSync } from 'fs';
import { getPathToDirectory } from '../utils';
import { ITemplateService } from '../types';

export class TemplateService implements ITemplateService {
  templateDirectoryName = "templates";

  async renderTemplate(templateName: string, templateData: { [key: string]: any }) {
    const pathToTemplateDirectory = this.getPathToTemplateDirectory();

    if (!pathToTemplateDirectory) {
      throw new Error('Could not find template directory');
    }

    const pathToTemplate = join(pathToTemplateDirectory, this.normalizeTemplateName(templateName));

    const renderedTemplate = await renderFile(pathToTemplate, templateData);
    return renderedTemplate;
  }

  private normalizeTemplateName(templateName: string) {
    return /\.ejs/.test(templateName) ? templateName : `${templateName}.ejs`;
  }
  private getPathToTemplateDirectory() {
    return getPathToDirectory(this.templateDirectoryName);
  }

  templateExists(templatePath: string) {
    return existsSync(templatePath) || existsSync(templatePath + '.ejs');
  }
}