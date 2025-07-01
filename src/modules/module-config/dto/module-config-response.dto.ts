export interface ConfigValueResponseDto {
  key: string;
  value: string;
  displayName?: string;
  dependentValues?: string[];
}

export interface ConfigFieldResponseDto {
  fieldName: string;
  fieldType: string;
  description?: string;
  values: ConfigValueResponseDto[];
}

export interface ModuleConfigResponseDto {
  _id: string;
  moduleId: string;
  moduleName?: string;
  projectId?: string;
  projectName?: string;
  configName: string;
  description?: string;
  fields: ConfigFieldResponseDto[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
