import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMovieJunctions1790295999794 implements MigrationInterface {
    name = 'AddMovieJunctions1790295999794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "movie_planet" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "movie_id" uuid NOT NULL, "planet_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_4a881f0871b8c2b9843b6821068" PRIMARY KEY ("movie_id", "planet_id"))`);
        await queryRunner.query(`CREATE TABLE "movie_character" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "movie_id" uuid NOT NULL, "character_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_853b729c3d14c56952e2b44b9fc" PRIMARY KEY ("movie_id", "character_id"))`);
        await queryRunner.query(`CREATE TABLE "movie_starship" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "movie_id" uuid NOT NULL, "starship_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_67d590703b13c552785093d458a" PRIMARY KEY ("movie_id", "starship_id"))`);
        await queryRunner.query(`CREATE TABLE "movie_species" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "movie_id" uuid NOT NULL, "species_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_a3246b0b8039b779e7d4564b9e8" PRIMARY KEY ("movie_id", "species_id"))`);
        await queryRunner.query(`CREATE TABLE "movie_vehicle" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "movie_id" uuid NOT NULL, "vehicle_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_21154d665d63aaede2138f70697" PRIMARY KEY ("movie_id", "vehicle_id"))`);
        await queryRunner.query(`ALTER TABLE "movie_planet" ADD CONSTRAINT "FK_4085623a4b264c2d62d8bec9cb0" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_planet" ADD CONSTRAINT "FK_092fa27a517b5d3ccee30df5654" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_planet" ADD CONSTRAINT "FK_74944ae71b43fdae5880dc78129" FOREIGN KEY ("planet_id") REFERENCES "planets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_character" ADD CONSTRAINT "FK_a44b6c718be1ee20491727f78c0" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_character" ADD CONSTRAINT "FK_fc7a7cdc6809be242f580d58fb8" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_character" ADD CONSTRAINT "FK_e39ab27947acaddb6dce1d42d91" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_starship" ADD CONSTRAINT "FK_0d525f0c513f30fbe06c3a78a54" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_starship" ADD CONSTRAINT "FK_5491f40841e1d2815e8d4ea97aa" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_starship" ADD CONSTRAINT "FK_13d4970751fecb641593884fa9f" FOREIGN KEY ("starship_id") REFERENCES "starships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_species" ADD CONSTRAINT "FK_64e36dea5ea96f0a717c77450f7" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_species" ADD CONSTRAINT "FK_e0271d4bddcc2db6146a4fc2fde" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_species" ADD CONSTRAINT "FK_fcf772c08d9a13895b40f20e04f" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_vehicle" ADD CONSTRAINT "FK_b11e00dbe0eeeb08a15c7f07011" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_vehicle" ADD CONSTRAINT "FK_9de424b1dd8ce9cb7353565dc9b" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_vehicle" ADD CONSTRAINT "FK_355930235aba8ab2dec197657fb" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movie_vehicle" DROP CONSTRAINT "FK_355930235aba8ab2dec197657fb"`);
        await queryRunner.query(`ALTER TABLE "movie_vehicle" DROP CONSTRAINT "FK_9de424b1dd8ce9cb7353565dc9b"`);
        await queryRunner.query(`ALTER TABLE "movie_vehicle" DROP CONSTRAINT "FK_b11e00dbe0eeeb08a15c7f07011"`);
        await queryRunner.query(`ALTER TABLE "movie_species" DROP CONSTRAINT "FK_fcf772c08d9a13895b40f20e04f"`);
        await queryRunner.query(`ALTER TABLE "movie_species" DROP CONSTRAINT "FK_e0271d4bddcc2db6146a4fc2fde"`);
        await queryRunner.query(`ALTER TABLE "movie_species" DROP CONSTRAINT "FK_64e36dea5ea96f0a717c77450f7"`);
        await queryRunner.query(`ALTER TABLE "movie_starship" DROP CONSTRAINT "FK_13d4970751fecb641593884fa9f"`);
        await queryRunner.query(`ALTER TABLE "movie_starship" DROP CONSTRAINT "FK_5491f40841e1d2815e8d4ea97aa"`);
        await queryRunner.query(`ALTER TABLE "movie_starship" DROP CONSTRAINT "FK_0d525f0c513f30fbe06c3a78a54"`);
        await queryRunner.query(`ALTER TABLE "movie_character" DROP CONSTRAINT "FK_e39ab27947acaddb6dce1d42d91"`);
        await queryRunner.query(`ALTER TABLE "movie_character" DROP CONSTRAINT "FK_fc7a7cdc6809be242f580d58fb8"`);
        await queryRunner.query(`ALTER TABLE "movie_character" DROP CONSTRAINT "FK_a44b6c718be1ee20491727f78c0"`);
        await queryRunner.query(`ALTER TABLE "movie_planet" DROP CONSTRAINT "FK_74944ae71b43fdae5880dc78129"`);
        await queryRunner.query(`ALTER TABLE "movie_planet" DROP CONSTRAINT "FK_092fa27a517b5d3ccee30df5654"`);
        await queryRunner.query(`ALTER TABLE "movie_planet" DROP CONSTRAINT "FK_4085623a4b264c2d62d8bec9cb0"`);
        await queryRunner.query(`DROP TABLE "movie_vehicle"`);
        await queryRunner.query(`DROP TABLE "movie_species"`);
        await queryRunner.query(`DROP TABLE "movie_starship"`);
        await queryRunner.query(`DROP TABLE "movie_character"`);
        await queryRunner.query(`DROP TABLE "movie_planet"`);
    }

}
