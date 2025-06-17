export interface CreateAobDocumentMasterDto {
  documentName: string;
  documentType: string;
  documentDescription: string;
  documentInstruction: string;
  category?: string;
}

export interface BulkCreateAobDocumentMasterDto {
  documents: CreateAobDocumentMasterDto[];
}
