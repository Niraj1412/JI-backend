import { Injectable } from '@nestjs/common';
import { Parser } from 'xml2js';

@Injectable()
export class XmlParserService {
  private readonly parser: Parser;

  constructor() {
    this.parser = new Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
      explicitCharkey: true,
      charkey: '_'
    });
  }

  async parse(xml: string): Promise<Record<string, unknown>> {
    return this.parser.parseStringPromise(xml);
  }

  extractItems(parsed: Record<string, unknown>): Record<string, unknown>[] {
    const rssChannel = (parsed as any)?.rss?.channel;
    const rssItems = rssChannel?.item;
    if (rssItems) {
      return Array.isArray(rssItems) ? rssItems : [rssItems];
    }

    const atomEntries = (parsed as any)?.feed?.entry;
    if (atomEntries) {
      return Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    }

    return [];
  }
}
