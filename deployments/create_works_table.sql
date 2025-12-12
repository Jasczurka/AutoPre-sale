CREATE TABLE IF NOT EXISTS "Works" (
    "Id" uuid NOT NULL,
    "ProjectId" uuid NOT NULL,
    "WorkNumber" text NOT NULL,
    "Level" integer NOT NULL,
    "Type" text NOT NULL,
    "AcceptanceCriteria" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "ParentId" uuid,
    CONSTRAINT "PK_Works" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Works_Works_ParentId" FOREIGN KEY ("ParentId") REFERENCES "Works"("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_Works_ParentId" ON "Works" ("ParentId");
CREATE INDEX IF NOT EXISTS "IX_Works_ProjectId" ON "Works" ("ProjectId");

