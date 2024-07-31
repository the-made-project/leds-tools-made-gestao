import { JiraIntegrationService } from "../service/JiraIntegratorService.js";
import { Util } from '../service/util.js';
import { createPath } from '../../generator-utils.js'
import { JsonFileCRUD } from "../dao/JsonFileCRUD.js";

export abstract class AbstractApplication {

  jiraIntegrationService: JiraIntegrationService
  jsonDAO!: JsonFileCRUD;
  DB_PATH: string
  objectMap!: Map<string, string>;

  constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string) {
      Util.mkdirSync(target_folder)

      this.DB_PATH = createPath(target_folder, 'db')

      this.jiraIntegrationService = new JiraIntegrationService(email, apiToken, host, projectKey);
  }

  protected async saveOnFile(key: any, value: any, _function: JsonFileCRUD, type: string) {
      try {
          value.type = type;
          await _function.create(key, value);
      } catch (error) {
      }
  }

  protected idExists(key: any, _function: JsonFileCRUD) {
      try {
          const exists = _function.idExists(key);
          return exists;
      } catch (error) {
          return false;
      }
  }

  protected async readByKey(key: any, _function: JsonFileCRUD) {
      try {
          const result = await _function.readByKey(key);
          return result;
      } catch (error) {
          return null;
      }
  }

}
