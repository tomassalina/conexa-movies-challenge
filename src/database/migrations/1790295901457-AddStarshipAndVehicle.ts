import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStarshipAndVehicle1790295901457 implements MigrationInterface {
    name = 'AddStarshipAndVehicle1790295901457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "starships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "swapi_id" character varying(10) NOT NULL, "name" character varying(255) NOT NULL, "model" character varying(255), "manufacturer" character varying(255), "cost_in_credits" bigint, "length" numeric(10,2), "max_atmosphering_speed" character varying(20), "crew" character varying(20), "passengers" character varying(20), "cargo_capacity" bigint, "consumables" character varying(50), "hyperdrive_rating" numeric(4,1), "mglt" smallint, "starship_class" character varying(100), "created_by" uuid NOT NULL, "updated_by" uuid NOT NULL, "deleted_by" uuid, CONSTRAINT "UQ_0eeabc4025b55f6d9e04f814514" UNIQUE ("swapi_id"), CONSTRAINT "PK_10c86d0ac9be05d3f986287a092" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "swapi_id" character varying(10) NOT NULL, "name" character varying(255) NOT NULL, "model" character varying(255), "manufacturer" character varying(255), "cost_in_credits" bigint, "length" numeric(10,2), "max_atmosphering_speed" character varying(20), "crew" character varying(20), "passengers" character varying(20), "cargo_capacity" bigint, "consumables" character varying(50), "vehicle_class" character varying(100), "created_by" uuid NOT NULL, "updated_by" uuid NOT NULL, "deleted_by" uuid, CONSTRAINT "UQ_d182d36421e5034c08c19fed719" UNIQUE ("swapi_id"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "starships" ADD CONSTRAINT "FK_61da54ca7a024cc08731024b764" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "starships" ADD CONSTRAINT "FK_b241207290a34dd30f6ab7bf6ce" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "starships" ADD CONSTRAINT "FK_343ca8dcda2c9d11a6d084679c8" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_a1fcdc1746e3b2fd4661ebecfbf" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_32f6fbaaec304bd9e80a6c11ba3" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_1e668844ab91a6bb06b3c791b62" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_1e668844ab91a6bb06b3c791b62"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_32f6fbaaec304bd9e80a6c11ba3"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_a1fcdc1746e3b2fd4661ebecfbf"`);
        await queryRunner.query(`ALTER TABLE "starships" DROP CONSTRAINT "FK_343ca8dcda2c9d11a6d084679c8"`);
        await queryRunner.query(`ALTER TABLE "starships" DROP CONSTRAINT "FK_b241207290a34dd30f6ab7bf6ce"`);
        await queryRunner.query(`ALTER TABLE "starships" DROP CONSTRAINT "FK_61da54ca7a024cc08731024b764"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "starships"`);
    }

}
