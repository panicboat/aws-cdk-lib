import * as cdk from '@aws-cdk/core';
import { Vpc } from './resources/vpc';
import { Subnet } from './resources/subnet';
import { Gateway } from './resources/gateway';
import { Iam } from './resources/iam';
import { Endpoint } from './resources/endpoint';
import { RouteTable } from './resources/routetable';
import { SecurityGroup } from './resources/securitygroup';

interface Props {
  projectName: string;
  cidrBlock: string;
  principal?: {
    accountIds?: string[];                    // For master accounts
    vpcCidrBlock?: string[];                  // For master accounts
    transitGatewayId?: string;                // For child accounts
    tgwAttachmentIds?: string[];              // For master accounts
  }
}
interface INetworkResources {
}
export class NetworkResources extends cdk.Construct implements INetworkResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    let principal = this.getValue(props.principal, {});
    let accountIds = this.getValue(principal.accountIds, []);
    let vpcCidrBlock = this.getValue(principal.vpcCidrBlock, []);
    let tgwAttachmentIds = this.getValue(principal.tgwAttachmentIds, []);
    let transitGatewayId = this.getValue(principal.transitGatewayId, '');

    const iam = new Iam(this);
    iam.createResources({ projectName: props.projectName });

    const vpc = new Vpc(this);
    vpc.createResources({ projectName: props.projectName, cidrBlock: props.cidrBlock, });

    const subnet = new Subnet(this);
    subnet.createResources({ projectName: props.projectName, vpcId: vpc.vpcId, cidrBlock: props.cidrBlock });

    const gateway = new Gateway(this);
    gateway.createResources({ projectName: props.projectName, vpcId: vpc.vpcId, subnets: { public: subnet.public, protected: subnet.protected },
      principal: { accountIds: accountIds, transitGatewayId: transitGatewayId, },
    });

    const routetable = new RouteTable(this);
    routetable.createResources({ projectName: props.projectName, vpcId: vpc.vpcId, subnets: { public: subnet.public, protected: subnet.protected },
      internetGatewayId: gateway.internetGatewayId,
      natGatewayIds: gateway.natGatewayIds,
      transitGatewayId: gateway.transitGatewayId,
      principal: { transitGatewayId: transitGatewayId, tgwAttachmentIds: tgwAttachmentIds, vpcCidrBlock: vpcCidrBlock },
    });

    const sg = new SecurityGroup(this);
    sg.createResources({ projectName: props.projectName, vpcId: vpc.vpcId, cidrBlock: props.cidrBlock });

    const endpoint = new Endpoint(this);
    endpoint.createResources({ projectName: props.projectName, vpcId: vpc.vpcId, subnets: { protected: subnet.protected }, securityGroupIds: [ sg.default ] });
  }

  private getValue(inputValue: any, defaultValue: any): any {
    return inputValue !== undefined ? inputValue : defaultValue;
  }
}
