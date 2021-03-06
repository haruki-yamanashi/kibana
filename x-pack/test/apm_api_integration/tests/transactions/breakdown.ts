/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import expect from '@kbn/expect';
import archives_metadata from '../../common/fixtures/es_archiver/archives_metadata';
import { FtrProviderContext } from '../../common/ftr_provider_context';
import { registry } from '../../common/registry';

export default function ApiTest({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  const archiveName = 'apm_8.0.0';
  const metadata = archives_metadata[archiveName];

  const start = encodeURIComponent(metadata.start);
  const end = encodeURIComponent(metadata.end);
  const transactionType = 'request';
  const transactionName = 'GET /api';
  const uiFilters = encodeURIComponent(JSON.stringify({}));

  registry.when('Breakdown when data is not loaded', { config: 'basic', archives: [] }, () => {
    it('handles the empty state', async () => {
      const response = await supertest.get(
        `/api/apm/services/opbeans-node/transaction/charts/breakdown?start=${start}&end=${end}&uiFilters=${uiFilters}&transactionType=${transactionType}`
      );
      expect(response.status).to.be(200);
      expect(response.body).to.eql({ timeseries: [] });
    });
  });

  registry.when('when data is loaded', { config: 'basic', archives: [archiveName] }, () => {
    it('returns the transaction breakdown for a service', async () => {
      const response = await supertest.get(
        `/api/apm/services/opbeans-node/transaction/charts/breakdown?start=${start}&end=${end}&uiFilters=${uiFilters}&transactionType=${transactionType}`
      );

      expect(response.status).to.be(200);
      expectSnapshot(response.body).toMatch();
    });
    it('returns the transaction breakdown for a transaction group', async () => {
      const response = await supertest.get(
        `/api/apm/services/opbeans-node/transaction/charts/breakdown?start=${start}&end=${end}&uiFilters=${uiFilters}&transactionType=${transactionType}&transactionName=${transactionName}`
      );

      expect(response.status).to.be(200);

      const { timeseries } = response.body;

      const numberOfSeries = timeseries.length;

      expectSnapshot(numberOfSeries).toMatchInline(`1`);

      const { title, color, type, data, hideLegend, legendValue } = timeseries[0];

      const nonNullDataPoints = data.filter((y: number | null) => y !== null);

      expectSnapshot(nonNullDataPoints.length).toMatchInline(`61`);

      expectSnapshot(
        data.slice(0, 5).map(({ x, y }: { x: number; y: number | null }) => {
          return {
            x: new Date(x ?? NaN).toISOString(),
            y,
          };
        })
      ).toMatchInline(`
          Array [
            Object {
              "x": "2020-12-08T13:57:30.000Z",
              "y": null,
            },
            Object {
              "x": "2020-12-08T13:58:00.000Z",
              "y": null,
            },
            Object {
              "x": "2020-12-08T13:58:30.000Z",
              "y": 1,
            },
            Object {
              "x": "2020-12-08T13:59:00.000Z",
              "y": 1,
            },
            Object {
              "x": "2020-12-08T13:59:30.000Z",
              "y": null,
            },
          ]
        `);

      expectSnapshot(title).toMatchInline(`"app"`);
      expectSnapshot(color).toMatchInline(`"#54b399"`);
      expectSnapshot(type).toMatchInline(`"areaStacked"`);
      expectSnapshot(hideLegend).toMatchInline(`false`);
      expectSnapshot(legendValue).toMatchInline(`"100%"`);

      expectSnapshot(data).toMatch();
    });
    it('returns the transaction breakdown sorted by name', async () => {
      const response = await supertest.get(
        `/api/apm/services/opbeans-node/transaction/charts/breakdown?start=${start}&end=${end}&uiFilters=${uiFilters}&transactionType=${transactionType}`
      );

      expect(response.status).to.be(200);
      expectSnapshot(response.body.timeseries.map((serie: { title: string }) => serie.title))
        .toMatchInline(`
          Array [
            "app",
            "http",
            "postgresql",
            "redis",
          ]
        `);
    });
  });
}
