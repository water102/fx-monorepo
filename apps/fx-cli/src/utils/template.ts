import * as ejs from 'ejs';

export function renderTemplate(content: string, data: {[key: string]: any}) {
  return ejs.render(content, data);
}