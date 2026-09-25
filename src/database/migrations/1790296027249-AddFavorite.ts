import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavorite1790296027249 implements MigrationInterface {
    name = 'AddFavorite1790296027249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "favorites" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "movie_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_cb52bfce48a840478bd23d38f60" PRIMARY KEY ("user_id", "movie_id"))`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_0b379143b23ad89c1f7cdcdd9ae" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_558972408544eba5e19428fb8d0" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_558972408544eba5e19428fb8d0"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_0b379143b23ad89c1f7cdcdd9ae"`);
        await queryRunner.query(`DROP TABLE "favorites"`);
    }

}
