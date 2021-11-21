import * as cdk from '@aws-cdk/core';
import { Vpc } from './resources/vpc';
import { Subnet } from './resources/subnet';
import { Gateway } from './resources/gateway';
import { Iam } from './resources/iam';
import { Endpoint } from './resources/endpoint';
import { RouteTable } from './resources/routetable';
import { SecurityGroup } from './resources/securitygroup';

interface Props {
  projectName: string
  cidrBlock: string
  principal?: {
    primary?: {
      accountId?: string
      transitGatewayId?: string
    }
    secondary?: {
      accountIds?: string[]
      cidrBlock?: string[]
      tgwAttachmentIds?: string[]
    }
  }
  endpoints?: {
    serviceName: string
    privateDnsEnabled: boolean
    vpcEndpointType: string
  }[]
}
interface IVpcResources {
}
export class VpcResources extends cdk.Construct implements IVpcResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const iam = new Iam(this).createSSMManagedInstanceRole({ projectName: props.projectName, });

    const vpcId = new Vpc(this).createVPC({ projectName: props.projectName, cidrBlock: props.cidrBlock, });
    const subnets = new Subnet(this).createSubnets({ projectName: props.projectName, vpcId: vpcId, cidrBlock: props.cidrBlock });

    const gateway = new Gateway(this);
    const igwId = gateway.createInternetGateway({ vpcId: vpcId });
    let ngwIds: string[] = [];
    if (props.principal?.primary?.transitGatewayId === undefined) {
      // For primary account
      ngwIds = gateway.createNatGateway({ subnets: subnets });
    }
    let tgwId: string = '';
    let attachement!: cdk.CfnResource;
    if (props.principal?.secondary?.accountIds && props.principal?.secondary?.accountIds.length !== 0) {
      // For primary account
      tgwId = gateway.createTransitGateway({ projectName: props.projectName, principal: { secondary: { accountIds: props.principal?.secondary?.accountIds } } });
      attachement = gateway.attachTransitGateway({ projectName: props.projectName, vpcId: vpcId, subnets: subnets, transitGatewayId: tgwId });
    }
    if (props.principal?.primary?.transitGatewayId && props.principal?.primary?.transitGatewayId.length !== 0) {
      // For secondary accounts
      attachement = gateway.attachTransitGateway({ projectName: props.projectName, vpcId: vpcId, subnets: subnets, transitGatewayId: props.principal?.primary?.transitGatewayId });
    }

    const routetable = new RouteTable(this);
    routetable.createVpcRoutePublic({
      vpcId: vpcId, internetGatewayId: igwId, subnets: subnets, principal: { primary: { transitGatewayId: tgwId }, secondary: { cidrBlock: (props.principal?.secondary?.cidrBlock || []) } }
    }).forEach(route => {
      if (attachement !== undefined) { route.addDependsOn(attachement) }
    });
    routetable.createVpcRoutePrivate({
      vpcId: vpcId, subnets: subnets, principal: { primary: { natGatewayIds: ngwIds, transitGatewayId: (props.principal?.primary?.transitGatewayId || '') } }
    }).forEach(route => {
      if (attachement !== undefined) { route.addDependsOn(attachement) }
    });
    if (tgwId.length !== 0) {
      // For primary account
      routetable.createTransitGatewayRoute(attachement, { principal: { primary: { transitGatewayId: tgwId }, secondary: { transitGatewayAttachmentIds: (props.principal?.secondary?.tgwAttachmentIds || []) } } });
    }

    const sgMain = new SecurityGroup(this).createMain({ vpcId: vpcId, cidrBlock: '10.0.0.0/8' });

    const endpoint = new Endpoint(this);
    endpoint.createVpcEndpoint({ vpcId: vpcId, subnets: { private: subnets.private }, securityGroupIds: [ sgMain ], endpoints: (props.endpoints || []) });
  }
}
