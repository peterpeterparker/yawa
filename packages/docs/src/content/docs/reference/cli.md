---
title: CLI
description: Reference for the yawa command-line interface.
---

The CLI is used to administrate your yawa server. It runs directly on the server and is not exposed over the network — all commands connect to a local-only port, so you need to exec into your Docker container to use it:

```bash
docker exec -it <container-name> ./cli <command>
```

## site

Manage the sites yawa collects analytics for.

| Subcommand | Description                     |
| ---------- | ------------------------------- |
| `create`   | Register a new site by hostname |
| `list`     | List all registered sites       |
| `update`   | Update the status of a site     |

### site create

```bash
./cli site create --hostname example.com
```

| Option       | Description                               |
| ------------ | ----------------------------------------- |
| `--hostname` | Hostname to register (e.g. "example.com") |

### site list

```bash
./cli site list
```

### site update

```bash
./cli site update --id <id> --status disabled
```

| Option     | Description                                      |
| ---------- | ------------------------------------------------ |
| `--id`     | Site ID to update                                |
| `--status` | New status (`active`, `disabled`, or `archived`) |

## token

Administrate access tokens. Tokens are used to authenticate MCP clients.

| Subcommand | Description               |
| ---------- | ------------------------- |
| `create`   | Create a new access token |
| `list`     | List all access tokens    |
| `disable`  | Disable an access token   |

### token create

```bash
./cli token create --name mytoken
```

| Option      | Description                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `--name`    | Name to identify the token                                                |
| `--expires` | Optional expiry datetime in ISO 8601 format (e.g. "2027-01-01T00:00:00Z") |

### token list

```bash
./cli token list
```

### token disable

```bash
./cli token disable --id <id>
```

| Option | Description         |
| ------ | ------------------- |
| `--id` | Token ID to disable |
