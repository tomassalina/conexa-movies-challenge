import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCharacterAndSpecies1790295867689 implements MigrationInterface {
    name = 'AddCharacterAndSpecies1790295867689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "characters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "swapi_id" character varying(10) NOT NULL, "name" character varying(255) NOT NULL, "height" smallint, "mass" integer, "hair_color" character varying(50), "skin_color" character varying(50), "eye_color" character varying(50), "birth_year" character varying(10), "gender" character varying(20), "created_by" uuid NOT NULL, "updated_by" uuid NOT NULL, "deleted_by" uuid, "planet_id" uuid, CONSTRAINT "UQ_99b2af3a4389d2582fcf2698bdb" UNIQUE ("swapi_id"), CONSTRAINT "PK_9d731e05758f26b9315dac5e378" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "species" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "swapi_id" character varying(10) NOT NULL, "name" character varying(255) NOT NULL, "classification" character varying(100), "designation" character varying(100), "average_height" numeric(6,2), "skin_colors" character varying(255), "hair_colors" character varying(255), "eye_colors" character varying(255), "average_lifespan" smallint, "language" character varying(100), "created_by" uuid NOT NULL, "updated_by" uuid NOT NULL, "deleted_by" uuid, "planet_id" uuid, CONSTRAINT "UQ_d0486e8af12bc605c4ff2c4a17a" UNIQUE ("swapi_id"), CONSTRAINT "PK_ae6a87f2423ba6c25dc43c32770" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "characters" ADD CONSTRAINT "FK_87284666e889257bb112d64bff7" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "characters" ADD CONSTRAINT "FK_2e94b6b2478a9ee65dea48b4a4e" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "characters" ADD CONSTRAINT "FK_2b2ed1459b9a4f4fbabf6234f43" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "characters" ADD CONSTRAINT "FK_4b247cda876f9056893570eecbc" FOREIGN KEY ("planet_id") REFERENCES "planets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "species" ADD CONSTRAINT "FK_a336882a6353ff088090112c353" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "species" ADD CONSTRAINT "FK_b1240433a4704cfc38ee87c9d6e" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "species" ADD CONSTRAINT "FK_7d36d656c9d8b3db20d40a40c36" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "species" ADD CONSTRAINT "FK_1b943ab03ecbe4358f8d1df5081" FOREIGN KEY ("planet_id") REFERENCES "planets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "species" DROP CONSTRAINT "FK_1b943ab03ecbe4358f8d1df5081"`);
        await queryRunner.query(`ALTER TABLE "species" DROP CONSTRAINT "FK_7d36d656c9d8b3db20d40a40c36"`);
        await queryRunner.query(`ALTER TABLE "species" DROP CONSTRAINT "FK_b1240433a4704cfc38ee87c9d6e"`);
        await queryRunner.query(`ALTER TABLE "species" DROP CONSTRAINT "FK_a336882a6353ff088090112c353"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP CONSTRAINT "FK_4b247cda876f9056893570eecbc"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP CONSTRAINT "FK_2b2ed1459b9a4f4fbabf6234f43"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP CONSTRAINT "FK_2e94b6b2478a9ee65dea48b4a4e"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP CONSTRAINT "FK_87284666e889257bb112d64bff7"`);
        await queryRunner.query(`DROP TABLE "species"`);
        await queryRunner.query(`DROP TABLE "characters"`);
    }

}
