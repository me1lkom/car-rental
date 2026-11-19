export function checkId(number: unknown) {
    number = Number(number)
    if (Number.isInteger(number) && Number(number) > 0) {
        return Number(number)
    }
    return false
}
