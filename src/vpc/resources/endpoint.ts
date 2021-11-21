import { CfnVPCEndpoint } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  vpcId: string
  subnets: {
    private: string[]
  }
  securityGroupIds: string[]
  endpoints: { serviceName: string, privateDnsEnabled: boolean, vpcEndpointType: string }[]
}
interface IEndpoint {
  createVpcEndpoint(props: Props): void;
}
export class Endpoint extends Resource implements IEndpoint {

  public createVpcEndpoint(props: Props) {
    const endpoints = props.endpoints.concat([
      { serviceName: 's3',      privateDnsEnabled: false, vpcEndpointType: 'Gateway' },
    ]);
    endpoints.forEach(endpoint => {
      new CfnVPCEndpoint(this.scope, `VpcEndpoint-${endpoint.serviceName}`, {
        serviceName: `com.amazonaws.${this.stack.region}.${endpoint.serviceName}`,
        vpcId: props.vpcId,
        privateDnsEnabled: endpoint.privateDnsEnabled,
        securityGroupIds: endpoint.vpcEndpointType === 'Gateway' ? undefined : props.securityGroupIds,
        subnetIds: endpoint.vpcEndpointType === 'Gateway' ? undefined : props.subnets.private,
        vpcEndpointType: endpoint.vpcEndpointType,
      });
    });
  }
}
