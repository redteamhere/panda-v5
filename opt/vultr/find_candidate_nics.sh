#!/usr/bin/env bash

udevadm settle > /dev/null 2>&1 || :

device_pattern='rndis_host'

interfaces=()
for iface in /sys/class/net/*; do
	if [[ "${iface##*/}" =~ ^lo$ ]]; then
		continue
	fi

	iface_path="$(realpath "${iface}")"
	driver="$(readlink "${iface_path}/device/driver")"
	if [[ "${driver##*/}" =~ ^(${device_pattern})$ ]]; then
		continue
	fi

	interfaces+=("${iface##*/}")
done

printf '%s\n' "${interfaces[@]}"
