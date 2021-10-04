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
    primary?: {
      accountId?: string;
      transitGatewayId?: string;
    };
    secondary?: {
      accountIds?: string[];
      cidrBlock?: string[];
      tgwAttachmentIds?: string[];
    };
  };
  endpoints?: { serviceName: string; privateDnsEnabled: boolean, vpcEndpointType: string }[];
}
interface IVpcResources {
}
export class VpcResources extends cdk.Construct implements IVpcResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    let principal = this.getValue(props.principal, {});
    let primary = this.getValue(principal.primary, {});
    let secondary = this.getValue(principal.secondary, {});

    const iam = new Iam(this);
    iam.createResources({ projectName: props.projectName, });

    const vpc = new Vpc(this);
    vpc.createResources({ projectName: props.projectName, cidrBlock: props.cidrBlock, });

    const subnet = new Subnet(this);
    subnet.createResources({ projectName: props.projectName, vpcId: vpc.vpcId, cidrBlock: props.cidrBlock });

    const gateway = new Gateway(this);
    gateway.createResources({
      projectName: props.projectName,
      vpcId: vpc.vpcId,
      subnets: { public: subnet.public, private: subnet.private },
      principal: {
        primary: { transitGatewayId: this.getValue(primary.transitGatewayId, '') },
        secondary: { accountIds: this.getValue(secondary.accountIds, []) }
      },
    });

    const routetable = new RouteTable(this);
    routetable.createResources({
      projectName: props.projectName,
      vpcId: vpc.vpcId,
      subnets: { public: subnet.public, private: subnet.private },
      internetGatewayId: gateway.internetGatewayId,
      natGatewayIds: gateway.natGatewayIds,
      transitGatewayId: gateway.transitGatewayId,
      attachment: gateway.attachment,
      principal: {
        primary: { transitGatewayId: this.getValue(primary.transitGatewayId, '') },
        secondary: { cidrBlock: this.getValue(secondary.cidrBlock, []), tgwAttachmentIds: this.getValue(secondary.tgwAttachmentIds, []) }
      },
    });

    const sg = new SecurityGroup(this);
    sg.createResources({ projectName: props.projectName, vpcId: vpc.vpcId, cidrBlock: props.cidrBlock });

    const endpoint = new Endpoint(this);
    endpoint.createResources({
      projectName: props.projectName,
      vpcId: vpc.vpcId,
      subnets: { private: subnet.private },
      securityGroupIds: [ sg.cidrblock ],
      endpoints: this.getValue(props.endpoints, [])
    });
  }

  private getValue(inputValue: any, defaultValue: any): any {
    return inputValue || defaultValue;
  }
}
