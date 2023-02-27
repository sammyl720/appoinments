

export interface ITemplateService {
  renderTemplate: (templateName: string, templateData: { [key: string]: any }) => Promise<string>;
}