import { CfnVPCEndpoint } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  subnets: {
    private: string[],
  },
  securityGroupIds: string[];
  endpoints: { serviceName: string; privateDnsEnabled: boolean }[];
}
interface IEndpoint {
  createResources(props: Props): void;
}
export class Endpoint extends Resource implements IEndpoint {
  public createResources(props: Props): void {
    props.endpoints.forEach(endpoint => {
      new CfnVPCEndpoint(this.scope, `VpcEndpoint-${endpoint.serviceName}`, {
        serviceName: `com.amazonaws.${this.stack.region}.${endpoint.serviceName}`,
        vpcId: props.vpcId,
        privateDnsEnabled: endpoint.privateDnsEnabled,
        securityGroupIds: props.securityGroupIds,
        subnetIds: props.subnets.private,
        vpcEndpointType: 'Interface',
      });
    });
  }
}
