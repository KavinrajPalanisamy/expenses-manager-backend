CREATE SCHEMA IF NOT EXISTS "expense_manager";

CREATE TABLE "expense_manager".user_roles (
    role_id UUID DEFAULT gen_random_uuid() NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT user_roles_pkey PRIMARY KEY (role_id),
    CONSTRAINT user_roles_role_name_key UNIQUE (role_name)
);


CREATE TABLE "expense_manager".user_credentials (
	user_id uuid DEFAULT gen_random_uuid() NOT NULL,
	username varchar(100) NOT NULL,
	email varchar(255) NOT NULL,
	current_password varchar(255) NOT NULL,
	role_id uuid NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	is_locked bool DEFAULT false NOT NULL,
	failed_login_attempts int4 DEFAULT 0 NOT NULL,
	last_login_at timestamp NULL,
	password_updated_at timestamp NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	first_name varchar(50) NOT NULL,
	last_name varchar(50) DEFAULT ''::character varying NULL,
	display_name varchar(24) NULL,
	date_of_birth date NOT NULL,
	CONSTRAINT user_credentials_email_key UNIQUE (email),
	CONSTRAINT user_credentials_pkey PRIMARY KEY (user_id),
	CONSTRAINT user_credentials_username_key UNIQUE (username),
	CONSTRAINT fk_user_credentials_role FOREIGN KEY (role_id) REFERENCES "expense_manager".user_roles(role_id)
);

CREATE TABLE "expense_manager".password_history (
    password_history_id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    last_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT password_history_pkey PRIMARY KEY (password_history_id),
    CONSTRAINT fk_password_history_user
        FOREIGN KEY (user_id)
        REFERENCES "expense_manager".user_credentials(user_id)
);

CREATE TABLE "expense_manager".session_details (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    expire_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
	revoked_reason VARCHAR(150) NULL,
    ip_address VARCHAR(20) NULL,
    os VARCHAR(25) null,
    user_agent VARCHAR(255) NULL,
    device_type VARCHAR(25) NULL,
    refresh_token VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT id_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES "expense_manager".user_credentials(user_id)
);


CREATE TABLE expense_manager.account_category (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	account_category varchar(50) NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT current_timestamp NULL,
	updated_at timestamp DEFAULT current_timestamp NULL,
	CONSTRAINT account_category_pk PRIMARY KEY (id),
	CONSTRAINT account_category_unique UNIQUE (account_category)
);
CREATE INDEX account_category_id_idx ON expense_manager.account_category (id);
CREATE INDEX account_category_account_category_idx ON expense_manager.account_category (account_category);
CREATE INDEX account_category_is_active_idx ON expense_manager.account_category (is_active);


CREATE TABLE expense_manager.account_types (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	account_category_id uuid NOT NULL,
	account_type varchar(100) NOT NULL,
	description varchar(200) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	is_active bool DEFAULT true NULL,
	CONSTRAINT account_types_pk PRIMARY KEY (id),
	CONSTRAINT account_types_unique UNIQUE (account_type),
    CONSTRAINT fk_account_category
        FOREIGN KEY (account_category_id)
        REFERENCES "expense_manager".account_category(id)
);
CREATE INDEX account_types_account_type_idx ON expense_manager.account_types USING btree (account_type);
CREATE INDEX account_types_created_at_idx ON expense_manager.account_types USING btree (created_at);
CREATE INDEX account_types_id_idx ON expense_manager.account_types USING btree (id);
CREATE INDEX account_types_is_active_idx ON expense_manager.account_types USING btree (is_active);
CREATE INDEX account_types_updated_at_idx ON expense_manager.account_types USING btree (updated_at);


CREATE TABLE expense_manager.providers (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	provider_type_id uuid NULL,
	provider_name varchar(100) NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT provider_pk PRIMARY KEY (id),
	CONSTRAINT providers_unique UNIQUE (provider_name),
    CONSTRAINT fk_provider_type
        FOREIGN KEY (provider_type_id)
        REFERENCES "expense_manager".provider_types(id)
);
CREATE INDEX providers_id_idx ON expense_manager.providers USING btree (id);
CREATE INDEX providers_provider_name_idx ON expense_manager.providers USING btree (provider_name);


CREATE TABLE expense_manager.provider_types (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	provider_type varchar(100) NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT provider_type_pk PRIMARY KEY (id),
	CONSTRAINT provider_type_unique UNIQUE (provider_type)
);
CREATE INDEX provider_type_id_idx ON expense_manager.provider_types USING btree (id);
CREATE INDEX provider_type_provider_type_idx ON expense_manager.provider_types USING btree (provider_type);


