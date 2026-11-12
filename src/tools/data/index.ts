import type { CategoryModule } from '@/components/tools/types';

import CsvFormatter from './csv-formatter';
import CsvToJson from './csv-to-json';
import JsonCsv from './json-csv';
import JsonDiff from './json-diff';
import JsonSchemaValidator from './json-schema-validator';
import JsonToCode from './json-to-code';
import JsonToTypescript from './json-to-typescript';
import JsonToZod from './json-to-zod';
import JsonXml from './json-xml';
import JsonYaml from './json-yaml';
import JsonPathTester from './jsonpath-tester';
import MarkdownTable from './markdown-table';
import TomlJson from './toml-json';
import XlsxConverter from './xlsx-converter';
import XmlFormatter from './xml-formatter';
import YamlValidator from './yaml-validator';

export const components: CategoryModule['components'] = {
  'json-yaml': JsonYaml,
  'json-xml': JsonXml,
  'json-csv': JsonCsv,
  'csv-formatter': CsvFormatter,
  'csv-to-json': CsvToJson,
  'toml-json': TomlJson,
  'yaml-validator': YamlValidator,
  'xml-formatter': XmlFormatter,
  'json-diff': JsonDiff,
  'jsonpath-tester': JsonPathTester,
  'json-schema-validator': JsonSchemaValidator,
  'json-to-typescript': JsonToTypescript,
  'json-to-zod': JsonToZod,
  'json-to-code': JsonToCode,
  'xlsx-converter': XlsxConverter,
  'markdown-table': MarkdownTable,
};
