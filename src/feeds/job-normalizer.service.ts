import { Injectable } from '@nestjs/common';
import { NormalizedJob } from '../jobs/jobs.service';
import { extractText, hashText, normalizeWhitespace, parseDate, toStringArray } from '../utils/text.utils';

@Injectable()
export class JobNormalizerService {
  normalize(item: Record<string, unknown>, sourceUrl: string): NormalizedJob | null {
    const title = normalizeWhitespace(
      extractText(item.title) || extractText(item['job_listing:title'])
    );

    const link = normalizeWhitespace(
      extractText(item.link) || extractText(item.guid) || extractText(item.id)
    );

    const guid = normalizeWhitespace(extractText(item.guid) || extractText(item.id));

    const description = normalizeWhitespace(
      extractText(item.description) ||
        extractText(item['content:encoded']) ||
        extractText(item.summary)
    );

    const company = normalizeWhitespace(
      extractText(item['job_listing:company']) ||
        extractText(item.company) ||
        extractText(item['job:company']) ||
        extractText(item.author)
    );

    const location = normalizeWhitespace(
      extractText(item['job_listing:location']) ||
        extractText(item.location) ||
        extractText(item['job:location'])
    );

    const categories = toStringArray(item.category ?? item.categories).map((value) => normalizeWhitespace(value)).filter(Boolean) as string[];

    const jobType = toStringArray(item['job_listing:job_type'] ?? item.type ?? item['job:type'])
      .map((value) => normalizeWhitespace(value))
      .filter(Boolean) as string[];

    const publishedAt = parseDate(
      extractText(item.pubDate) ||
        extractText(item.published) ||
        extractText(item.updated)
    );

    const source = this.getSourceName(sourceUrl);
    const externalId = guid || link || this.createFallbackId(title, company, publishedAt, sourceUrl);

    if (!title || !externalId) {
      return null;
    }

    return {
      source,
      sourceUrl,
      externalId,
      guid,
      title,
      description,
      company,
      location,
      categories,
      jobType,
      url: link,
      publishedAt,
      raw: item
    };
  }

  private getSourceName(sourceUrl: string): string {
    try {
      const url = new URL(sourceUrl);
      return url.hostname;
    } catch {
      return sourceUrl;
    }
  }

  private createFallbackId(
    title?: string,
    company?: string,
    publishedAt?: Date,
    sourceUrl?: string
  ): string {
    const base = [title, company, publishedAt?.toISOString(), sourceUrl].filter(Boolean).join('|');
    return hashText(base || `fallback-${Date.now()}`);
  }
}
