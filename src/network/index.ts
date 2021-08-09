import * as cdk from '@aws-cdk/core';
import { Vpc } from './resources/vpc';
import { Subnet } from './resources/subnet';
import { Gateway } from './resources/gateway';
import { Iam } from './resources/iam';
import { RouteTable } from './resources/routetable';

interface Props {
  projectName: string;
  cidrBlock: string;
}
interface INetworkResources {
}
export class NetworkResources extends cdk.Construct implements INetworkResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const vpc = new Vpc(this);
    vpc.createResources({ projectName: props.projectName, cidrBlock: props.cidrBlock, });

    const subnet = new Subnet(this);
    subnet.createResources({ projectName: props.projectName, vpcId: vpc.VpcId, cidrBlock: props.cidrBlock });

    const gateway = new Gateway(this);
    gateway.createResources({ projectName: props.projectName, vpcId: vpc.VpcId, subnets: { protected: subnet.protected }});

    const routetable = new RouteTable(this);
    routetable.createResources({ projectName: props.projectName, vpcId: vpc.VpcId, gatewayId: gateway.gatewayId, natGatewayId: gateway.natGatewayId, subnets: { public: subnet.public, protected: subnet.protected }});

    const iam = new Iam(this);
    iam.createResources({ projectName: props.projectName });
  }
}
