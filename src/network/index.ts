import * as cdk from '@aws-cdk/core';
import { Vpc } from './resources/vpc';
import { Subnet } from './resources/subnet';
import { Gateway } from './resources/gateway';
import { Iam } from './resources/iam';
import { VpcRouteTable } from './resources/vpc-route';
import { TgwRouteTable } from './resources/tgw-route';
import { Endpoint } from './resources/endpoint';

interface Props {
  projectName: string;
  cidrBlock: string;
  principal?: {
    accountIds?: string[];                    // For master accounts
    vpcCidrBlock?: string[];                  // For master accounts
    tgwAttachmentIds?: string[];              // For master accounts
    transitGatewayId?: string;                // For child accounts
  }
  isFoundation?: boolean;
  isReadyTGW?: boolean;
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
    let isFoundation = this.getValue(props.isFoundation, false);
    let isReadyTGW = this.getValue(props.isReadyTGW, false);

    const iam = new Iam(this);
    iam.createResources({ projectName: props.projectName });

    const vpc = new Vpc(this);
    vpc.createResources({ projectName: props.projectName, cidrBlock: props.cidrBlock, });

    const subnet = new Subnet(this);
    subnet.createResources({ projectName: props.projectName, vpcId: vpc.VpcId, cidrBlock: props.cidrBlock });

    const gateway = new Gateway(this);
    gateway.createResources({ projectName: props.projectName, vpcId: vpc.VpcId, subnets: { public: subnet.public, protected: subnet.protected },
      principal: { accountIds: accountIds, transitGatewayId: transitGatewayId, },
      isFoundation: isFoundation,
    });

    const endpoint = new Endpoint(this);
    endpoint.createResources({ projectName: props.projectName, vpcId: vpc.VpcId, cidrBlock: props.cidrBlock, subnets: { protected: subnet.protected } });

    const routetable1 = new VpcRouteTable(this);
    routetable1.createResources({ projectName: props.projectName, vpcId: vpc.VpcId, subnets: { public: subnet.public, protected: subnet.protected },
      internetGatewayId: gateway.internetGatewayId,
      natGatewayIds: gateway.natGatewayIds,
      transitGatewayId: gateway.transitGatewayId,
      principal: { transitGatewayId: transitGatewayId, vpcCidrBlock: vpcCidrBlock },
    });

    if (!isReadyTGW) {
      return;
    }

    const routetable2 = new TgwRouteTable(this);
    routetable2.createResources({ projectName: props.projectName,
      transitGatewayId: gateway.transitGatewayId,
      tgwAttachmentId: gateway.tgwAttachmentId,
      principal: { tgwAttachmentIds: tgwAttachmentIds, },
    });
  }

  private getValue(inputValue: any, defaultValue: any): any {
    return inputValue !== undefined ? inputValue : defaultValue;
  }
}
