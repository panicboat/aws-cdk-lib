import { ISubnet } from "@aws-cdk/aws-ec2";

export interface Props {
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

export interface VpcPros {
  projectName: string
  cidrBlock: string
}

export interface SubnetProps {
  projectName: string
  vpcId: string
  cidrBlock: string
}

export interface VpcRoutePublicProps {
  vpcId: string
  internetGatewayId: string
  subnets: {
    public: string[]
  }
  principal: {
    primary: {
      transitGatewayId: string
    }
    secondary: {
      cidrBlock: string[]
    }
  }
}

export interface VpcRoutePrivateProps {
  vpcId: string
  subnets: {
    private: string[]
  }
  principal: {
    primary: {
      natGatewayIds: string[]
      transitGatewayId: string
    }
  }
}

export interface TransitGatewayRouteProps {
  principal: {
    primary: {
      transitGatewayId: string
    }
    secondary: {
      transitGatewayAttachmentIds: string[]
    }
  }
}

export interface InternetGatewayProps {
  vpcId: string
}

export interface NatGatewayProps {
  subnets: {
    public: string[]
  }
}

export interface TransitGatewayProps {
  projectName: string
  principal: {
    secondary: {
      accountIds: string[]
    }
  }
}

export interface AttachTransitGatewayProps {
  projectName: string
  vpcId: string
  subnets: {
    private: string[]
  }
  transitGatewayId: string
}

export interface EndpointProps {
  vpcId: string
  subnets: {
    private: string[]
  }
  securityGroupIds: string[]
  endpoints: {
    serviceName: string
    privateDnsEnabled: boolean
    vpcEndpointType: string
  }[]
  routeTables: {
    public: string[]
    private: string[]
  }
}

export interface IamProps {
  projectName: string
}

export interface SecurityGroupProps {
  vpcId: string
  cidrBlock: string
}

export interface SubnetRouteTableAssociationProps {
  subnets: ISubnet[],
  destinationCidrBlock: string,
  principal: {
    primary: {
      transitGatewayId: string
    }
  }
}
