import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlanet1790295811600 implements MigrationInterface {
    name = 'AddPlanet1790295811600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "planets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "swapi_id" character varying(10) NOT NULL, "name" character varying(255) NOT NULL, "rotation_period" integer, "orbital_period" integer, "diameter" integer, "climate" character varying(255), "gravity" character varying(50), "terrain" character varying(255), "surface_water" smallint, "population" bigint, "created_by" uuid NOT NULL, "updated_by" uuid NOT NULL, "deleted_by" uuid, CONSTRAINT "UQ_fc4afb6f3294516fef4f0e47f1e" UNIQUE ("swapi_id"), CONSTRAINT "PK_d5fbc2513a6d4909fe31938b0fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "planets" ADD CONSTRAINT "FK_abf1011893051c771438ebaf582" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "planets" ADD CONSTRAINT "FK_a66b811884f1dffdeb793938b40" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "planets" ADD CONSTRAINT "FK_be23eec7aff25802525a5431fce" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "planets" DROP CONSTRAINT "FK_be23eec7aff25802525a5431fce"`);
        await queryRunner.query(`ALTER TABLE "planets" DROP CONSTRAINT "FK_a66b811884f1dffdeb793938b40"`);
        await queryRunner.query(`ALTER TABLE "planets" DROP CONSTRAINT "FK_abf1011893051c771438ebaf582"`);
        await queryRunner.query(`DROP TABLE "planets"`);
    }

}
