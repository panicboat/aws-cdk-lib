import * as cdk from '@aws-cdk/core';
import { Iam } from './resources/iam';

interface Props {
  projectName: string;
  principal?: {
    primary?: {
      accountId?: string;
    }
  };
}
interface IAuditResources {
}
export class AuditResources extends cdk.Construct implements IAuditResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    let principal = this.getValue(props.principal, {});
    let primary = this.getValue(principal.primary, {});

    const iam = new Iam(this);
    iam.createResources({
      projectName: props.projectName,
      principal: { primary: { accountId: this.getValue(primary.accountId, '') } },
    });
  }

  private getValue(inputValue: any, defaultValue: any): any {
    return inputValue || defaultValue;
  }
}
