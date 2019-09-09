# Napps [![Build Status](https://travis-ci.org/ktfth/napps.svg?branch=master)](https://travis-ci.org/ktfth/napps)

## Description

Text searcher

## Installation

```
[sudo] npm i -g napps
```

### Simple usage

```
echo "some sample" | napps sample
sample (1)
```

```
cat sample.txt | napps sample --extract
```

```
napps test --extract --exclude=txt
```

```
napps test --extract --exclude=txt --rev
```

```
curl http://fth-ship.github.io/sea/ | napps "p" --extract --html
```

## Contribute

### Information

Contact across issues or by email Kaique da Silva <kaeyosthaeron@gmail.com>
