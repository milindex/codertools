import type { CategoryModule } from '@/components/tools/types';

import DockerCompose from './docker-compose';
import GitignoreGenerator from './gitignore-generator';
import HtaccessGenerator from './htaccess-generator';
import HttpStatus from './http-status';
import IpCidr from './ip-cidr';
import MetaTagGenerator from './meta-tag-generator';
import MimeLookup from './mime-lookup';
import NginxGenerator from './nginx-generator';
import OpenGraphPreview from './open-graph-preview';
import QueryString from './query-string';
import RobotsGenerator from './robots-generator';
import SitemapGenerator from './sitemap-generator';
import SubnetCalculator from './subnet-calculator';
import UrlParser from './url-parser';
import UserAgentParser from './user-agent-parser';

export const components: CategoryModule['components'] = {
  'http-status': HttpStatus,
  'mime-lookup': MimeLookup,
  'user-agent-parser': UserAgentParser,
  'url-parser': UrlParser,
  'query-string': QueryString,
  'ip-cidr': IpCidr,
  'subnet-calculator': SubnetCalculator,
  'meta-tag-generator': MetaTagGenerator,
  'open-graph-preview': OpenGraphPreview,
  'robots-generator': RobotsGenerator,
  'htaccess-generator': HtaccessGenerator,
  'nginx-generator': NginxGenerator,
  'gitignore-generator': GitignoreGenerator,
  'docker-compose': DockerCompose,
  'sitemap-generator': SitemapGenerator,
};
