export class CreateResourceCenterDocumentDto {
  resourceCenterId!: string;
  documentId?: string;
  documentType!: string | string[];
  documentFormat?: string;
  updatedBy?: string;
  createdBy?: string;
}
