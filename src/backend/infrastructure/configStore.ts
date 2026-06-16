import { IConfigStore } from '../application/ports.js';
import { AppConfig, SettingsDTO, settingsSchema, configSchema } from '@trackforge/shared';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export class JsonConfigStore implements IConfigStore {
  private config: AppConfig;
  private configPath: string;

  constructor(configDir: string, sourceDir: string, destinationDir: string) {
    this.configPath = path.join(configDir, 'config.json');

    let fileConfig: Partial<AppConfig> = {};
    try {
      const raw = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      fileConfig = configSchema.partial().parse(parsed);
    } catch {
      fileConfig = {};
    }

    this.config = {
      sourceDir,
      destinationDir,
      configDir,
      compilationsDirectory: fileConfig.compilationsDirectory ?? 'Compilations',
      maxLibrarySizeGb: fileConfig.maxLibrarySizeGb ?? 64,
    };

    this.persist();
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  getSettings(): SettingsDTO {
    return {
      compilationsDirectory: this.config.compilationsDirectory,
      maxLibrarySizeGb: this.config.maxLibrarySizeGb,
    };
  }

  updateSettings(settings: Partial<SettingsDTO>): SettingsDTO {
    const merged = { ...this.getSettings(), ...settings };
    const validated = settingsSchema.parse(merged);

    this.config = {
      ...this.config,
      compilationsDirectory: validated.compilationsDirectory,
      maxLibrarySizeGb: validated.maxLibrarySizeGb,
    };

    this.persist();
    return validated;
  }

  private persist(): void {
    const toWrite: Partial<AppConfig> = {
      compilationsDirectory: this.config.compilationsDirectory,
      maxLibrarySizeGb: this.config.maxLibrarySizeGb,
    };
    writeFileSync(this.configPath, JSON.stringify(toWrite, null, 2), 'utf-8');
  }
}
