import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMovie1790295925597 implements MigrationInterface {
    name = 'AddMovie1790295925597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "swapi_id" character varying(10), "title" character varying(255) NOT NULL, "episode_id" smallint, "opening_crawl" text, "director" character varying(255), "producer" character varying(255), "release_date" date, "poster_url" character varying(2048), "created_by" uuid NOT NULL, "updated_by" uuid NOT NULL, "deleted_by" uuid, CONSTRAINT "UQ_c925d35378b4694d866a7ef2024" UNIQUE ("swapi_id"), CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "FK_d9bdf4b965d917d35ab4e759f65" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "FK_dc1e082844b378d7f852227d104" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "FK_0aab8918b585b011078518b2bda" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "FK_0aab8918b585b011078518b2bda"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "FK_dc1e082844b378d7f852227d104"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "FK_d9bdf4b965d917d35ab4e759f65"`);
        await queryRunner.query(`DROP TABLE "movies"`);
    }

}
